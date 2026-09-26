"""ABA PayWay card payments. A checkout is paid only once Check Transaction says so."""

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time
from datetime import datetime, timezone
from functools import lru_cache
from typing import Literal, NamedTuple
from urllib.parse import urlsplit

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

PURCHASE_PATH = "/api/payment-gateway/v1/payments/purchase"
CHECK_PATH = "/api/payment-gateway/v1/payments/check-transaction-2"
LINK_CARD_PATH = "/api/payment-credential/v3/cof/link-card"
TOKEN_DETAILS_PATH = "/api/payment-credential/v3/token-management/get-token-details"
REMOVE_TOKEN_PATH = "/api/payment-credential/v3/token-management/remove-token"
TOKEN_PAYMENT_PATH = "/api/payment-gateway/v3/purchase/payment-credential"

# Customer-initiated token flags: link once, then pay on demand.
LINK_TOKEN_FLAG = "CITI_FLEX"
PAY_TOKEN_FLAG = "CITU_FLEX"

# PayWay signs a purchase over these fields, in exactly this order.
_PURCHASE_HASH_ORDER = (
    "req_time",
    "merchant_id",
    "tran_id",
    "amount",
    "items",
    "shipping",
    "firstname",
    "lastname",
    "email",
    "phone",
    "type",
    "payment_option",
    "return_url",
    "cancel_url",
    "continue_success_url",
    "return_deeplink",
    "currency",
    "custom_fields",
    "return_params",
    "payout",
    "lifetime",
    "additional_params",
    "google_pay_token",
    "skip_success_page",
)

CHECKOUT_LIFETIME_MINUTES = 20
MAX_EMAIL_LENGTH = 50


class PaywayNotConfigured(RuntimeError):
    pass


class PaywayUnavailable(RuntimeError):
    pass


WRONG_KEY_MESSAGE = (
    "PayWay rejected the request signature - PAYWAY_API_KEY does not belong "
    "to PAYWAY_MERCHANT_ID. Copy both again from the PayWay merchant portal."
)


PaywayStatus = Literal["approved", "pending", "declined", "cancelled", "refunded"]

_STATUS_BY_CODE: dict[int, PaywayStatus] = {
    0: "approved",
    2: "pending",
    3: "declined",
    4: "refunded",
    7: "cancelled",
}


class PaywayTransaction(NamedTuple):
    status: PaywayStatus
    amount_cents: int | None
    currency: str | None


def _require_config() -> None:
    if not settings.payway_merchant_id or not settings.payway_api_key:
        raise PaywayNotConfigured(
            "PAYWAY_MERCHANT_ID and PAYWAY_API_KEY must be set in the backend "
            "environment before card payments can be taken."
        )


def _sign(*values: str) -> str:
    digest = hmac.new(
        settings.payway_api_key.encode(),
        "".join(values).encode(),
        hashlib.sha512,
    ).digest()
    return base64.b64encode(digest).decode()


def _b64_json(value: object) -> str:
    return base64.b64encode(json.dumps(value).encode()).decode()


def _req_time() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def _format_amount(amount_cents: int) -> str:
    return f"{amount_cents // 100}.{amount_cents % 100:02d}"


def _to_cents(value: object) -> int | None:
    try:
        return round(float(value) * 100)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _api_base() -> str:
    """Scheme and host only, in case PAYWAY_API_URL holds a full endpoint URL."""
    parts = urlsplit(settings.payway_api_url.strip())
    return f"{parts.scheme or 'https'}://{parts.netloc or parts.path.strip('/')}"


def _b64(value: str) -> str:
    return base64.b64encode(value.encode()).decode()


def _callback_url(path: str) -> str:
    """Base64 URL PayWay should call back, or "" to use the profile default."""
    base = settings.backend_public_url.rstrip("/")
    return _b64(base + path) if base else ""


def _plain_amount(amount_cents: int) -> str:
    """Amount as PHP prints it: 1, 2.5, 2.99."""
    whole, cents = divmod(amount_cents, 100)
    if cents == 0:
        return str(whole)
    return f"{whole}.{cents:02d}".rstrip("0")


def purchase_url() -> str:
    return _api_base() + PURCHASE_PATH


def new_tran_id() -> str:
    """18 digits; PayWay allows at most 20."""
    return f"{time.time_ns() // 1_000_000}{secrets.randbelow(10**5):05d}"


def build_card_checkout(
    tran_id: str,
    amount_cents: int,
    currency: str,
    item_name: str,
    email: str | None,
    continue_success_url: str,
    cancel_url: str,
) -> dict[str, str]:
    """The signed form fields the browser posts to `purchase_url()`."""
    _require_config()
    amount = _format_amount(amount_cents)
    fields = {
        "req_time": _req_time(),
        "merchant_id": settings.payway_merchant_id,
        "tran_id": tran_id,
        "amount": amount,
        "items": _b64_json([{"name": item_name, "quantity": 1, "price": float(amount)}]),
        "email": email if email and len(email) <= MAX_EMAIL_LENGTH else "",
        "type": "purchase",
        "payment_option": "cards",
        "return_url": _callback_url("/api/payments/payway/callback"),
        "cancel_url": cancel_url,
        "continue_success_url": continue_success_url,
        "currency": currency,
        "lifetime": str(CHECKOUT_LIFETIME_MINUTES),
        "skip_success_page": "1",
    }
    fields["hash"] = _sign(*(fields.get(key, "") for key in _PURCHASE_HASH_ORDER))
    # Unsigned fields: open as PayWay's popup, via Checkout rather than the QR API.
    fields["view_type"] = "popup"
    fields["payment_gate"] = "0"
    return {key: value for key, value in fields.items() if value != ""}


@lru_cache
def _client() -> httpx.Client:
    return httpx.Client(timeout=httpx.Timeout(15.0, connect=10.0))


def check_transaction(tran_id: str) -> PaywayTransaction:
    """The only proof of payment."""
    _require_config()
    req_time = _req_time()
    try:
        response = _client().post(
            _api_base() + CHECK_PATH,
            json={
                "req_time": req_time,
                "merchant_id": settings.payway_merchant_id,
                "tran_id": tran_id,
                "hash": _sign(req_time, settings.payway_merchant_id, tran_id),
            },
        )
    except httpx.HTTPError as exc:
        logger.error("PayWay check for %s could not be sent: %s", tran_id, exc)
        raise PaywayUnavailable(f"Could not reach PayWay: {exc}") from exc

    try:
        body = response.json()
    except ValueError as exc:
        logger.error(
            "PayWay check for %s returned HTTP %s non-JSON: %s",
            tran_id,
            response.status_code,
            response.text[:300],
        )
        raise PaywayUnavailable("PayWay returned a response we cannot read.") from exc

    data = body.get("data") if isinstance(body, dict) else None
    data = data if isinstance(data, dict) else {}
    status = body.get("status") if isinstance(body, dict) else None
    if not isinstance(status, dict):
        status = data.get("status") if isinstance(data.get("status"), dict) else {}
    code = str(status.get("code", ""))

    if code == "6":
        # Not found yet: the shopper hasn't opened PayWay's page.
        return PaywayTransaction("pending", None, None)
    if "wrong hash" in str(status.get("message", "")).lower():
        logger.error("PayWay: %s", WRONG_KEY_MESSAGE)
        raise PaywayUnavailable(WRONG_KEY_MESSAGE)
    if code not in ("00", "0"):
        logger.error(
            "PayWay check for %s failed: HTTP %s code=%r message=%r",
            tran_id,
            response.status_code,
            code,
            status.get("message"),
        )
        raise PaywayUnavailable(f"PayWay could not check this payment (code {code}).")

    payment_code = data.get("payment_status_code")
    result = _STATUS_BY_CODE.get(payment_code) if isinstance(payment_code, int) else None
    if result is None:
        logger.warning(
            "PayWay %s has unexpected payment_status_code=%r status=%r",
            tran_id,
            payment_code,
            data.get("payment_status"),
        )
        result = "pending"

    return PaywayTransaction(
        status=result,
        amount_cents=_to_cents(data.get("original_amount", data.get("total_amount"))),
        currency=data.get("payment_currency"),
    )


# --- Credentials on File: saved cards -------------------------------------


class SavedToken(NamedTuple):
    active: bool
    pwt: str | None
    brand: str | None
    masked_number: str | None
    expires_at: str | None


def _post_json(path: str, payload: dict, what: str) -> dict:
    try:
        response = _client().post(_api_base() + path, json=payload)
    except httpx.HTTPError as exc:
        logger.error("PayWay %s could not be sent: %s", what, exc)
        raise PaywayUnavailable(f"Could not reach PayWay: {exc}") from exc
    try:
        body = response.json()
    except ValueError as exc:
        logger.error(
            "PayWay %s returned HTTP %s non-JSON: %s",
            what,
            response.status_code,
            response.text[:300],
        )
        raise PaywayUnavailable("PayWay returned a response we cannot read.") from exc
    return body if isinstance(body, dict) else {}


def _status_code(body: dict) -> str:
    status = body.get("status")
    code = str(status.get("code", "")) if isinstance(status, dict) else ""
    message = str(status.get("message", "")) if isinstance(status, dict) else ""
    if "wrong hash" in message.lower():
        logger.error("PayWay: %s", WRONG_KEY_MESSAGE)
        raise PaywayUnavailable(WRONG_KEY_MESSAGE)
    return code


def ctid_for_user(user_id: str) -> str:
    """Stable 24-char PayWay customer id per user."""
    return hashlib.sha256(f"resumate:{user_id}".encode()).hexdigest()[:24]


def new_request_id() -> str:
    return new_tran_id()


def link_card_url() -> str:
    return _api_base() + LINK_CARD_PATH


def build_link_card(request_id: str, ctid: str) -> dict[str, str]:
    """Signed fields for PayWay's "save a card" form."""
    _require_config()
    fields = {
        "request_id": request_id,
        "request_time": _req_time(),
        "merchant_id": settings.payway_merchant_id,
        "ctid": ctid,
        "token_flag": LINK_TOKEN_FLAG,
        "currency": "USD",
        "callback_url": _callback_url("/api/payments/cards/callback"),
    }
    fields["hash"] = _sign(
        fields["merchant_id"],
        fields["request_time"],
        fields["ctid"],
        fields["callback_url"],
        fields["request_id"],
        fields["token_flag"],
        "",  # frequency - scheduled tokens only
        "",  # amount - scheduled tokens only
        fields["currency"],
        "",  # continue_success_url - the sandbox rejects the hash when it is set
    )
    return {key: value for key, value in fields.items() if value != ""}


def get_token_details(request_id: str) -> SavedToken | None:
    """The token for a Link Card request, or None if not saved yet."""
    _require_config()
    request_time = _req_time()
    body = _post_json(
        TOKEN_DETAILS_PATH,
        {
            "request_time": request_time,
            "merchant_id": settings.payway_merchant_id,
            "request_id": request_id,
            "hash": _sign(settings.payway_merchant_id, request_time, request_id),
        },
        f"token details for {request_id}",
    )
    data = body.get("data")
    if _status_code(body) not in ("00", "0") or not isinstance(data, dict):
        logger.info("PayWay has no token for %s yet: %r", request_id, body.get("status"))
        return None
    return SavedToken(
        active=data.get("status") == 1 and bool(data.get("pwt")),
        pwt=data.get("pwt"),
        brand=data.get("type"),
        masked_number=data.get("source_of_fund"),
        expires_at=data.get("expired_at"),
    )


def remove_token(ctid: str, pwt: str) -> None:
    _require_config()
    request_time = _req_time()
    body = _post_json(
        REMOVE_TOKEN_PATH,
        {
            "merchant_id": settings.payway_merchant_id,
            "ctid": ctid,
            "request_time": request_time,
            "pwt": pwt,
            "hash": _sign(settings.payway_merchant_id, ctid, request_time, pwt),
        },
        "remove token",
    )
    if _status_code(body) not in ("00", "0"):
        logger.warning("PayWay did not confirm token removal: %r", body.get("status"))


def pay_with_token(
    tran_id: str,
    ctid: str,
    pwt: str,
    amount_cents: int,
    currency: str,
    item_name: str,
    email: str | None,
) -> bool:
    """True if PayWay accepted the charge; check_transaction confirms approval."""
    _require_config()
    amount = _plain_amount(amount_cents)
    email = email if email and len(email) <= MAX_EMAIL_LENGTH else None
    callback_url = _callback_url("/api/payments/payway/callback")
    items = _b64_json([{"name": item_name, "quantity": 1, "price": float(amount)}])
    request_time = _req_time()
    # Signed in this exact order; empty values count as "".
    hash_parts = {
        "request_time": request_time,
        "merchant_id": settings.payway_merchant_id,
        "tran_id": tran_id,
        "amount": amount,
        "currency": currency,
        "items": items,
        "ctid": ctid,
        "pwt": pwt,
        "first_name": "",
        "last_name": "",
        "email": email or "",
        "phone": "",
        "purchase_type": "purchase",
        "callback_url": callback_url,
        "custom_fields": "",
        "return_params": "",
        "payout": "",
        "token_flag": PAY_TOKEN_FLAG,
        "shipping_fee": "0",
    }
    payload: dict[str, object] = {
        key: (value or None) for key, value in hash_parts.items()
    }
    payload["amount"] = float(amount)
    payload["shipping_fee"] = 0
    payload["hash"] = _sign(*hash_parts.values())

    body = _post_json(TOKEN_PAYMENT_PATH, payload, f"token payment {tran_id}")
    if _status_code(body) not in ("00", "0"):
        logger.error("PayWay refused token payment %s: %r", tran_id, body.get("status"))
        return False
    return True
