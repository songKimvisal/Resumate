from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.templates import (
    GrantTemplatesRequest,
    TemplateEntitlements,
    UnlockTemplateRequest,
)
from app.services.templates import get_entitlements, grant_for_pack, unlock_template

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=TemplateEntitlements)
def read_templates(user: CurrentUser = Depends(get_current_user)) -> TemplateEntitlements:
    return get_entitlements(user.id)


@router.post("/grant", response_model=TemplateEntitlements)
def grant_templates(
    body: GrantTemplatesRequest,
    user: CurrentUser = Depends(get_current_user),
) -> TemplateEntitlements:
    return grant_for_pack(user.id, body.pack_id, body.template_id)


@router.post("/unlock", response_model=TemplateEntitlements)
def unlock_template_route(
    body: UnlockTemplateRequest,
    user: CurrentUser = Depends(get_current_user),
) -> TemplateEntitlements:
    unlocked, entitlements = unlock_template(user.id, body.template_id)
    if not unlocked:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "No template slots remaining",
                "entitlements": entitlements.model_dump(),
            },
        )
    return entitlements
