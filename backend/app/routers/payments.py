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
from app.services.khqr import KhqrNotConfigured, check_khqr_payment, create_khqr_payment
from app.services.payments import list_payments, record_payment

router = APIRouter(prefix="/api", tags=["payments"])


@router.get("/payments", response_model=PaymentHistory)
def read_payments(user: CurrentUser = Depends(get_current_user)) -> PaymentHistory:
    return PaymentHistory(payments=list_payments(user.id))


@router.post("/payments/record", response_model=PaymentRecord)
def create_payment_record(
    body: RecordPaymentRequest,
    user: CurrentUser = Depends(get_current_user),
) -> PaymentRecord:
    return record_payment(user.id, body)


@router.post("/payments/khqr/create", response_model=CreateKhqrResponse)
def create_khqr(
    body: CreateKhqrRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CreateKhqrResponse:
    try:
        qr_string, md5 = create_khqr_payment(
            amount=body.amount_cents / 100,
            currency=body.currency,
            bill_number=body.pack_id,
        )
    except KhqrNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return CreateKhqrResponse(qr_string=qr_string, md5=md5)


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
        status="paid" if paid else "pending", next_delay_seconds=next_delay
    )