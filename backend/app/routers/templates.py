from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.templates import (
    GrantTemplatesRequest,
    PurchaseTemplateRequest,
    TemplateEntitlements,
    UnlockTemplateRequest,
)
from app.services.templates import (
    get_entitlements,
    grant_for_pack,
    purchase_premium_template,
    unlock_customization,
    unlock_template,
)

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


@router.post("/unlock-customization", response_model=TemplateEntitlements)
def unlock_customization_route(
    user: CurrentUser = Depends(get_current_user),
) -> TemplateEntitlements:
    """Payment is verified client-side, call only after it's recorded."""
    return unlock_customization(user.id)


@router.post("/purchase", response_model=TemplateEntitlements)
def purchase_premium_template_route(
    body: PurchaseTemplateRequest,
    user: CurrentUser = Depends(get_current_user),
) -> TemplateEntitlements:
    """Call only after the $1.99 flat purchase has been recorded."""
    purchased, entitlements = purchase_premium_template(user.id, body.template_id)
    if not purchased:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Unknown premium template",
                "entitlements": entitlements.model_dump(),
            },
        )
    return entitlements
