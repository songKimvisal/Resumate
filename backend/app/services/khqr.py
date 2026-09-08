from functools import lru_cache

from bakong_khqr import KHQR

from app.config import settings


class KhqrNotConfigured(RuntimeError):
    pass


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
    """Returns (qr_string, md5) for a real, scannable Bakong KHQR code."""
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


# keep well under the 100 requests/day developer token limit
POLL_DELAY_SECONDS = 15


def check_khqr_payment(
    md5: str, start_time: float | None = None
) -> tuple[bool, int]:
    khqr = _client()
    paid = khqr.check_payment(md5) == "PAID"
    return paid, 0 if paid else POLL_DELAY_SECONDS
