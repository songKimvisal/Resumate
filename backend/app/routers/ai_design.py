from fastapi import APIRouter, Depends

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.ai_design import AiDesignRequest, AiDesignResponse
from app.services.ai_design import get_ai_design_recommendation

router = APIRouter(prefix="/api/ai-design", tags=["ai-design"])


@router.post("/recommend", response_model=AiDesignResponse)
def recommend(
    body: AiDesignRequest,
    user: CurrentUser = Depends(get_current_user),
) -> AiDesignResponse:
    return get_ai_design_recommendation(body.answers, body.templates)
