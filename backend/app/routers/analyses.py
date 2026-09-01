from fastapi import APIRouter, Depends

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.analyses import AnalysisBalance, GrantAnalysesRequest
from app.services.analyses import get_balance, grant_for_pack

router = APIRouter(prefix="/api/analyses", tags=["analyses"])


@router.get("", response_model=AnalysisBalance)
def read_analyses(user: CurrentUser = Depends(get_current_user)) -> AnalysisBalance:
    return get_balance(user.id)


@router.post("/grant", response_model=AnalysisBalance)
def grant_analyses(
    body: GrantAnalysesRequest,
    user: CurrentUser = Depends(get_current_user),
) -> AnalysisBalance:
    return grant_for_pack(user.id, body.pack_id)
