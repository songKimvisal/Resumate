from fastapi import APIRouter, Depends

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.credits import CreditBalance, GrantCreditsRequest
from app.services.credits import get_balance, grant_for_pack

router = APIRouter(prefix="/api", tags=["credits"])


@router.get("/credits", response_model=CreditBalance)
def read_credits(user: CurrentUser = Depends(get_current_user)) -> CreditBalance:
    return get_balance(user.id)


@router.post("/credits/grant", response_model=CreditBalance)
def grant_credits(
    body: GrantCreditsRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CreditBalance:
    return grant_for_pack(user.id, body.pack_id)
