from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.pdfs import ConsumePdfResult, GrantPdfsRequest, PdfBalance
from app.services.pdfs import (
    consume_result,
    consume_save,
    get_balance,
    grant_for_pack,
    refund_save,
)

router = APIRouter(prefix="/api/pdfs", tags=["pdfs"])


@router.get("", response_model=PdfBalance)
def read_pdfs(user: CurrentUser = Depends(get_current_user)) -> PdfBalance:
    return get_balance(user.id)


@router.post("/grant", response_model=PdfBalance)
def grant_pdfs(
    body: GrantPdfsRequest,
    user: CurrentUser = Depends(get_current_user),
) -> PdfBalance:
    return grant_for_pack(user.id, body.pack_id)


@router.post("/consume", response_model=ConsumePdfResult)
def consume_pdf(user: CurrentUser = Depends(get_current_user)) -> ConsumePdfResult:
    consumed, balance = consume_save(user.id)
    if not consumed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "No PDF saves remaining",
                "pdfs": balance.model_dump(),
            },
        )
    return consume_result(True, balance)


@router.post("/refund", response_model=PdfBalance)
def refund_pdf(user: CurrentUser = Depends(get_current_user)) -> PdfBalance:
    return refund_save(user.id)
