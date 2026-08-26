from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.smart_rewrite import SmartRewriteRequest, SmartRewriteResponse
from app.services.credits import consume_credit, get_balance, refund_credit
from app.services.smart_rewrite import rewrite_text

router = APIRouter(prefix="/api/smart-rewrite", tags=["smart-rewrite"])


@router.post("", response_model=SmartRewriteResponse)
def smart_rewrite(
    body: SmartRewriteRequest,
    user: CurrentUser = Depends(get_current_user),
) -> SmartRewriteResponse:
    consumed, balance = consume_credit(user.id)
    if not consumed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "No AI credits remaining",
                "credits": balance.model_dump(),
            },
        )

    result = rewrite_text(body.field_type, body.text)
    credits = refund_credit(user.id) if result.source == "fallback" else get_balance(user.id)
    return SmartRewriteResponse(
        variations=result.variations,
        source=result.source,
        credits=credits,
    )
