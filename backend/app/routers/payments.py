import logging

from fastapi import APIRouter, Depends, HTTPException

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.payments import (
    CreateKhqrRequest,
    CreateKhqrResponse,
    KhqrStatusResponse,
    PaymentHistory,
    PaymentRecord,
    RecordPaymentRequest,
)
from app.services.fulfilment import FulfilmentFailed, fulfil_sku
from app.services.khqr import KhqrNotConfigured, check_khqr_payment, create_khqr_payment
from app.services.payments import (
    claim_khqr_payment,
    create_khqr_intent,
    list_payments,
    record_payment,
    release_khqr_payment,
)
from app.services.pricing import CURRENCY, UnknownSku, price_cents_for_sku

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["payments"])


@router.get("/payments", response_model=PaymentHistory)
def read_payments(user: CurrentUser = Depends(get_current_user)) -> PaymentHistory:
    return PaymentHistory(payments=list_payments(user.id))


@router.post("/payments/record", response_model=PaymentRecord)
def create_payment_record(
    body: RecordPaymentRequest,
    user: CurrentUser = Depends(get_current_user),
) -> PaymentRecord:
    try:
        return record_payment(user.id, body)
    except UnknownSku as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/payments/khqr/create", response_model=CreateKhqrResponse)
def create_khqr(
    body: CreateKhqrRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CreateKhqrResponse:
    try:
        amount_cents = price_cents_for_sku(body.pack_id)
    except UnknownSku as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        qr_string, md5 = create_khqr_payment(
            amount=amount_cents / 100,
            currency=CURRENCY,
            bill_number=body.pack_id,
        )
    except KhqrNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        # The Bakong SDK rejects an out-of-spec merchant name (>25 chars),
        # city (>15) or currency. Say so instead of a bare 500.
        logger.error("Bakong rejected the QR details: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Bakong rejected the QR details: {exc}",
        ) from exc

    try:
        create_khqr_intent(
            user_id=user.id,
            sku=body.pack_id,
            pack_name=body.pack_name,
            amount_cents=amount_cents,
            currency=CURRENCY,
            md5=md5,
        )
    except HTTPException as exc:
        # No intent row means this server cannot fulfil the payment itself.
        # Checkout still works; the browser falls back to its own grant call.
        logger.warning("Could not record KHQR intent %s: %s", md5, exc.detail)

    return CreateKhqrResponse(
        qr_string=qr_string,
        md5=md5,
        amount_cents=amount_cents,
        currency=CURRENCY,
    )


@router.get("/payments/khqr/status/{md5}", response_model=KhqrStatusResponse)
def get_khqr_status(
    md5: str,
    start_time: float | None = None,
    user: CurrentUser = Depends(get_current_user),
) -> KhqrStatusResponse:
    try:
        paid, next_delay = check_khqr_payment(md5, start_time)
    except KhqrNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return KhqrStatusResponse(
        status="paid" if paid else "pending",
        next_delay_seconds=next_delay,
        fulfilled=_fulfil_confirmed_payment(user.id, md5) if paid else False,
    )


def _fulfil_confirmed_payment(user_id: str, md5: str) -> bool:
    """Bakong confirmed the money arrived, so grant the pack here - once.

    The claim is what makes it once: the database flips the payment from
    pending to succeeded for exactly one caller, and only that caller grants.
    Returns False when this server could not fulfil the checkout at all, which
    tells the browser to fall back to the older client-driven grant.
    """
    try:
        claim = claim_khqr_payment(user_id, md5)
    except HTTPException as exc:
        logger.warning("Could not claim KHQR payment %s: %s", md5, exc.detail)
        return False

    if not claim.known:
        return False
    if not claim.claimed:
        return True  # an earlier poll already granted this one

    sku = claim.sku or ""
    try:
        fulfil_sku(user_id, sku)
    except UnknownSku:
        # Real money for something we cannot grant. Keep the claim so this
        # does not loop, and shout - it needs a human.
        logger.error("Paid KHQR checkout %s has ungrantable SKU %r", md5, sku)
        return False
    except (FulfilmentFailed, HTTPException) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        logger.error("Granting %r after KHQR %s failed: %s", sku, md5, detail)
        try:
            release_khqr_payment(user_id, md5)
        except HTTPException:
            logger.exception("Could not release KHQR claim %s for retry", md5)
        return False

    return True