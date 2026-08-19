from fastapi import APIRouter, Depends

from app.auth.supabase_jwt import CurrentUser, get_current_user

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
def read_current_user(user: CurrentUser = Depends(get_current_user)):
    """Proves the frontend -> FastAPI -> Supabase auth chain works end to end."""
    return {"id": user.id, "email": user.email}
