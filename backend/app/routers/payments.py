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
from app.services.fulfilment import grants_for_sku
from app.services.khqr import (
    KhqrCheckUnavailable,
    KhqrNotConfigured,
    check_khqr_payment,
    create_khqr_payment,
)
from app.services.payments import (
    create_khqr_intent,
    fulfil_khqr_payment,
    list_payments,
    read_khqr_payment,
    record_payment,
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
        logger.error("Could not record KHQR intent %s: %s", md5, exc.detail)
        raise HTTPException(
            status_code=503,
            detail="Could not start this checkout. Please try again shortly.",
        ) from exc

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
    except KhqrCheckUnavailable as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return KhqrStatusResponse(
        status="paid" if paid else "pending",
        next_delay_seconds=next_delay,
        fulfilled=_fulfil_confirmed_payment(user.id, md5) if paid else False,
    )


def _fulfil_confirmed_payment(user_id: str, md5: str) -> bool:
    """Grant this checkout. True only once the entitlements are in the database."""
    try:
        payment = read_khqr_payment(user_id, md5)
    except HTTPException as exc:
        logger.warning("Could not read KHQR payment %s: %s", md5, exc.detail)
        return False

    if not payment.known:
        logger.error(
            "Paid KHQR %s has no checkout row for user %s - cannot fulfil it",
            md5,
            user_id,
        )
        return False
    if payment.fulfilled:
        return True

    sku = payment.sku or ""
    try:
        spec = grants_for_sku(sku)
    except UnknownSku:
        logger.error("Paid KHQR checkout %s has ungrantable SKU %r", md5, sku)
        return False

    try:
        return fulfil_khqr_payment(user_id, md5, spec).fulfilled
    except HTTPException as exc:
        logger.error("Granting %r after KHQR %s failed: %s", sku, md5, exc.detail)
        return False