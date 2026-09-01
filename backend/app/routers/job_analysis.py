from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.job_analysis import JobAnalysisRequest, JobAnalysisResponse
from app.services.analyses import consume_analysis, get_balance, refund_analysis
from app.services.job_analysis import analyze_job

router = APIRouter(prefix="/api/job-analysis", tags=["job-analysis"])


@router.post("", response_model=JobAnalysisResponse)
def job_analysis(
    body: JobAnalysisRequest,
    user: CurrentUser = Depends(get_current_user),
) -> JobAnalysisResponse:
    consumed, balance = consume_analysis(user.id)
    if not consumed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "No job analyses remaining",
                "analyses": balance.model_dump(),
            },
        )

    result = analyze_job(body.job_text, body.resume_text)
    analyses = (
        refund_analysis(user.id)
        if result.source == "fallback"
        else get_balance(user.id)
    )
    return JobAnalysisResponse(**result.model_dump(), analyses=analyses)
