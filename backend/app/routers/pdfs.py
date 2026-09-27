from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.pdfs import (
    ConsumePdfRequest,
    ConsumePdfResult,
    GrantPdfsRequest,
    PdfBalance,
    PdfStatus,
)
from app.services.pdfs import (
    consume_for_resume,
    consume_result,
    consume_save,
    get_balance,
    grant_for_pack,
    refund_for_resume,
    refund_save,
    unlocked_resume_ids,
)

router = APIRouter(prefix="/api/pdfs", tags=["pdfs"])


@router.get("", response_model=PdfStatus)
def read_pdfs(user: CurrentUser = Depends(get_current_user)) -> PdfStatus:
    balance = get_balance(user.id)
    return PdfStatus(
        **balance.model_dump(),
        unlocked_resume_ids=unlocked_resume_ids(user.id),
    )


@router.post("/grant", response_model=PdfBalance)
def grant_pdfs(
    body: GrantPdfsRequest,
    user: CurrentUser = Depends(get_current_user),
) -> PdfBalance:
    return grant_for_pack(user.id, body.pack_id)


@router.post("/consume", response_model=ConsumePdfResult)
def consume_pdf(
    body: ConsumePdfRequest | None = None,
    user: CurrentUser = Depends(get_current_user),
) -> ConsumePdfResult:
    if body and body.resume_id:
        consumed, charged, balance = consume_for_resume(user.id, body.resume_id)
    else:
        consumed, balance = consume_save(user.id)
        charged = consumed
    if not consumed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "No PDF saves remaining",
                "pdfs": balance.model_dump(),
            },
        )
    return consume_result(True, balance, charged)


@router.post("/refund", response_model=PdfBalance)
def refund_pdf(
    body: ConsumePdfRequest | None = None,
    user: CurrentUser = Depends(get_current_user),
) -> PdfBalance:
    if body and body.resume_id:
        return refund_for_resume(user.id, body.resume_id)
    return refund_save(user.id)
