import logging
import time
from functools import lru_cache

import httpx
from bakong_khqr import KHQR

from app.config import settings

logger = logging.getLogger(__name__)


class KhqrNotConfigured(RuntimeError):
    pass


class KhqrCheckUnavailable(RuntimeError):
    pass


class KhqrQuotaExhausted(KhqrCheckUnavailable):
    pass


BAKONG_API = "https://api-bakong.nbc.gov.kh/v1"

_HTTP_REASONS = {
    401: (
        "BAKONG_TOKEN is wrong or expired - renew it at "
        "https://api-bakong.nbc.gov.kh/register/"
    ),
    403: (
        "Bakong only answers requests from Cambodian IP addresses, and this "
        "host's egress is not one. Set BAKONG_PROXY_URL to a Cambodian proxy "
        "or move the backend to a Cambodian host."
    ),
    429: "Bakong's daily quota for this token is used up.",
    500: "Bakong had an internal error.",
    502: "Bakong is unreachable.",
    503: "Bakong is unavailable.",
    504: "Bakong timed out on its own side.",
}


QUOTA_ERROR_CODE = 17
QUOTA_MESSAGE = (
    "Bakong's daily request limit of 100 for this token is used up. "
    "It resets tomorrow."
)
QUOTA_RETRY_AFTER_SECONDS = 10 * 60
_quota_blocked_until = 0.0


def quota_exhausted() -> bool:
    return time.time() < _quota_blocked_until


@lru_cache
def _client() -> KHQR:
    if not settings.bakong_token or not settings.bakong_account_id:
        raise KhqrNotConfigured(
            "BAKONG_TOKEN and BAKONG_ACCOUNT_ID must be set in the backend "
            "environment before real KHQR payments can be created."
        )
    return KHQR(settings.bakong_token)


def create_khqr_payment(
    amount: float, currency: str, bill_number: str
) -> tuple[str, str]:
    if quota_exhausted():
        logger.warning("Refusing to mint a KHQR for %s: %s", bill_number, QUOTA_MESSAGE)
        raise KhqrQuotaExhausted(QUOTA_MESSAGE)

    khqr = _client()
    qr_string = khqr.create_qr(
        account_id=settings.bakong_account_id,
        merchant_name=settings.bakong_merchant_name or "Resumate",
        merchant_city=settings.bakong_merchant_city,
        amount=amount,
        currency=currency,
        bill_number=bill_number[:25],
    )
    return qr_string, khqr.generate_md5(qr_string)

MIN_POLL_DELAY_SECONDS = 60


def _next_delay_seconds(start_time: float | None) -> int:
    elapsed = time.time() - start_time if start_time else 0.0
    if elapsed < 5 * 60:
        bakong_delay = 5
    elif elapsed < 15 * 60:
        bakong_delay = 10
    elif elapsed < 60 * 60:
        bakong_delay = 15
    else:
        bakong_delay = 300
    return max(bakong_delay, MIN_POLL_DELAY_SECONDS)

PAID_CACHE_SECONDS = 60 * 60
UNPAID_CACHE_SECONDS = 10
FAST_CHECKS_PER_QR = 6
SLOW_UNPAID_CACHE_SECONDS = 60
_result_cache: dict[str, tuple[float, bool, int]] = {}
_checks_spent: dict[str, int] = {}


def _prune_cache(now: float) -> None:
    for md5 in [
        key
        for key, (cached_at, _, _) in _result_cache.items()
        if now - cached_at > PAID_CACHE_SECONDS
    ]:
        del _result_cache[md5]
        _checks_spent.pop(md5, None)


def _unpaid_cache_seconds(md5: str) -> int:
    if _checks_spent.get(md5, 0) < FAST_CHECKS_PER_QR:
        return UNPAID_CACHE_SECONDS
    return SLOW_UNPAID_CACHE_SECONDS


@lru_cache
def _bakong_client() -> httpx.Client:
    kwargs: dict[str, object] = {"timeout": httpx.Timeout(15.0, connect=10.0)}
    if settings.bakong_proxy_url:
        kwargs["proxy"] = settings.bakong_proxy_url
    return httpx.Client(**kwargs)


def _post_check(md5: str) -> httpx.Response:
    return _bakong_client().post(
        f"{BAKONG_API}/check_transaction_by_md5",
        json={"md5": md5},
        headers={
            "Authorization": f"Bearer {settings.bakong_token}",
            "Content-Type": "application/json",
        },
    )


def check_khqr_payment(
    md5: str, start_time: float | None = None
) -> tuple[bool, int]:
    global _quota_blocked_until

    if not settings.bakong_token or not settings.bakong_account_id:
        raise KhqrNotConfigured(
            "BAKONG_TOKEN and BAKONG_ACCOUNT_ID must be set in the backend "
            "environment before real KHQR payments can be checked."
        )

    now = time.time()
    _prune_cache(now)

    cached = _result_cache.get(md5)
    if cached is not None:
        cached_at, cached_paid, cached_delay = cached
        if cached_paid or now - cached_at < _unpaid_cache_seconds(md5):
            logger.debug("KHQR %s answered from cache: paid=%s", md5, cached_paid)
            return cached_paid, cached_delay

    if now < _quota_blocked_until:
        # Spending a refused request to be told again would be pointless.
        logger.warning("Skipping Bakong check for %s: %s", md5, QUOTA_MESSAGE)
        raise KhqrQuotaExhausted(QUOTA_MESSAGE)

    _checks_spent[md5] = _checks_spent.get(md5, 0) + 1
    try:
        response = _post_check(md5)
    except httpx.HTTPError as exc:
        logger.error("Bakong check for %s could not be sent: %s", md5, exc)
        raise KhqrCheckUnavailable(f"Could not reach Bakong: {exc}") from exc

    if response.status_code not in (200, 201):
        reason = _HTTP_REASONS.get(
            response.status_code, f"Bakong replied HTTP {response.status_code}."
        )
        logger.error(
            "Bakong check for %s failed: HTTP %s - %s | body=%s",
            md5,
            response.status_code,
            reason,
            response.text[:300],
        )
        raise KhqrCheckUnavailable(reason)

    try:
        body = response.json()
    except ValueError as exc:
        logger.error("Bakong check for %s returned non-JSON: %s", md5, response.text[:300])
        raise KhqrCheckUnavailable("Bakong returned a response we cannot read.") from exc

    if not isinstance(body, dict):
        logger.error("Bakong check for %s returned %r, not an object", md5, body)
        raise KhqrCheckUnavailable("Bakong returned a response we cannot read.")

    code = body.get("responseCode")
    message = str(body.get("responseMessage") or "")

    error_code = body.get("errorCode")

    if code == 0:
        logger.info("Bakong confirmed KHQR %s is paid", md5)
        _result_cache[md5] = (now, True, 0)
        return True, 0

    if error_code == QUOTA_ERROR_CODE or "daily request limit" in message.lower():
        _quota_blocked_until = now + QUOTA_RETRY_AFTER_SECONDS
        logger.error("Bakong daily request limit reached: %s", message)
        raise KhqrQuotaExhausted(QUOTA_MESSAGE)

    if error_code == 1 or "could not be found" in message.lower():
        logger.debug("KHQR %s still unpaid: %s", md5, message)
    else:
        logger.warning(
            "Bakong check for %s: unexpected responseCode=%r errorCode=%r message=%r",
            md5,
            code,
            error_code,
            message,
        )

    delay = _next_delay_seconds(start_time)
    _result_cache[md5] = (now, False, delay)
    return False, delay
