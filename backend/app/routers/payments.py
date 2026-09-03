from fastapi import APIRouter, Depends

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.payments import PaymentHistory, PaymentRecord, RecordPaymentRequest
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