from fastapi import APIRouter, Depends

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.smart_rewrite import SmartRewriteRequest, SmartRewriteResponse
from app.services.smart_rewrite import rewrite_text

router = APIRouter(prefix="/api/smart-rewrite", tags=["smart-rewrite"])


@router.post("", response_model=SmartRewriteResponse)
def smart_rewrite(
    body: SmartRewriteRequest,
    user: CurrentUser = Depends(get_current_user),
) -> SmartRewriteResponse:
    return rewrite_text(body.field_type, body.text)
