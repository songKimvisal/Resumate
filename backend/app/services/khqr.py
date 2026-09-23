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
    """Bakong refused to say whether this md5 was paid.

    This is deliberately NOT the same as "not paid yet". The bakong-khqr SDK
    collapses the two: any response whose ``responseCode`` is not 0 becomes
    ``UNPAID``, and for a non-2xx reply that still carries a ``responseCode``
    it never raises at all. An expired token, a non-Cambodian egress IP or an
    exhausted daily quota therefore looked exactly like an unpaid QR, so the
    browser polled a QR that had already been paid, forever, against a
    backend answering 200 OK. Checking the HTTP status first is what keeps
    those apart.
    """


class KhqrQuotaExhausted(KhqrCheckUnavailable):
    """Bakong's daily request allowance for this token is used up.

    A subclass of KhqrCheckUnavailable because it is one particular way
    Bakong refuses to answer, so every caller that already handles the
    general case keeps handling this one. It is named separately because it
    is the refusal that must also block *minting* a QR: encoding a code
    costs no quota, but the code would be real and payable, and confirming
    the money it takes does cost quota. Handing one out while the allowance
    is gone takes a shopper's money for something we cannot unlock.
    """


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
    """True while Bakong has told us this token is out of requests for today.

    The window is a re-probe interval, not the real reset: the allowance
    resets tomorrow, but we cannot know when, so we stop asking for
    QUOTA_RETRY_AFTER_SECONDS and then let one check find out. Like the
    result cache this lives in the process, so a Render spin-down clears it
    and the next check re-discovers the block.
    """
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
    """Returns (qr_string, md5) for a real, scannable Bakong KHQR code.

    Refuses while the daily allowance is gone. The encoding itself would
    still succeed - that is exactly the problem, see KhqrQuotaExhausted.
    """
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
    """How long the browser should wait before asking again.

    Bakong's published matrix is 5s for the first 5 minutes, 10s to 15
    minutes, 15s to an hour and 300s after that. We take the wider of that and
    MIN_POLL_DELAY_SECONDS so a long-abandoned QR backs off the way Bakong
    wants without a fresh one burning the daily quota in five minutes.
    """
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
UNPAID_CACHE_SECONDS = 90
_result_cache: dict[str, tuple[float, bool, int]] = {}


def _prune_cache(now: float) -> None:
    for md5 in [
        key
        for key, (cached_at, _, _) in _result_cache.items()
        if now - cached_at > PAID_CACHE_SECONDS
    ]:
        del _result_cache[md5]


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
    """Ask Bakong whether `md5` was paid.

    Returns (paid, next_delay_seconds). Raises KhqrCheckUnavailable when
    Bakong did not answer the question, so the caller can say so instead of
    reporting a paid QR as still pending.
    """
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
        if cached_paid or now - cached_at < UNPAID_CACHE_SECONDS:
            logger.debug("KHQR %s answered from cache: paid=%s", md5, cached_paid)
            return cached_paid, cached_delay

    if now < _quota_blocked_until:
        # Spending a refused request to be told again would be pointless.
        logger.warning("Skipping Bakong check for %s: %s", md5, QUOTA_MESSAGE)
        raise KhqrQuotaExhausted(QUOTA_MESSAGE)

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
