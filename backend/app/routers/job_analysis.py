from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.job_analysis import JobAnalysisRequest, JobAnalysisResponse
from app.services.credits import consume_credit, get_balance, refund_credit
from app.services.job_analysis import analyze_job

router = APIRouter(prefix="/api/job-analysis", tags=["job-analysis"])


@router.post("", response_model=JobAnalysisResponse)
def job_analysis(
    body: JobAnalysisRequest,
    user: CurrentUser = Depends(get_current_user),
) -> JobAnalysisResponse:
    consumed, balance = consume_credit(user.id)
    if not consumed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "No AI credits remaining",
                "credits": balance.model_dump(),
            },
        )

    result = analyze_job(body.job_text, body.resume_text)
    credits = (
        refund_credit(user.id) if result.source == "fallback" else get_balance(user.id)
    )
    return JobAnalysisResponse(**result.model_dump(), credits=credits)
