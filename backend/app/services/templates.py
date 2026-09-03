import json

from app.schemas.templates import PackId, TemplateEntitlements
from app.services.supabase_rest import rest_rpc

# Keep in sync with frontend/src/data/templates/premium/*.ts
PREMIUM_TEMPLATE_IDS: tuple[str, ...] = (
    "banking-sidebar",
    "banking-classic-noPhoto",
    "tech-sidebar",
    "tech-classic-noPhoto",
    "designer-sidebar",
    "designer-classic-noPhoto",
    "freshgrad-sidebar",
    "freshgrad-classic-noPhoto",
    "hospitality-classic",
    "hospitality-sidebar",
    "hospitality-classic-noPhoto",
    "ngo-classic",
    "ngo-sidebar",
    "ngo-classic-noPhoto",
)

SLOTS_BY_PACK: dict[PackId, int] = {
    "design": 1,
    "ai-basic": 0,
    "ai-plus": 0,
    "ai-pro": 0,
    "both-starter": 1,
    "both-standard": 3,
    "both-everything": -1,
}


def _parse_ids(raw: object) -> list[str]:
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return []
    if not isinstance(raw, list):
        return []
    return [str(item) for item in raw if isinstance(item, str) and item]


def _from_row(row: dict) -> TemplateEntitlements:
    pack_id = row.get("pack_id")
    return TemplateEntitlements(
        pack_id=pack_id if pack_id in SLOTS_BY_PACK else None,
        template_slots=int(row.get("template_slots", 0) or 0),
        unlocked_template_ids=_parse_ids(row.get("unlocked_template_ids")),
        customization_unlocked=bool(row.get("customization_unlocked", False)),
        premium_templates_owned=_parse_ids(row.get("premium_templates_owned")),
    )


def get_entitlements(user_id: str) -> TemplateEntitlements:
    row = rest_rpc("get_template_entitlements", {"p_user_id": user_id})
    if isinstance(row, dict) and row:
        return _from_row(row)
    return TemplateEntitlements()


def grant_for_pack(
    user_id: str,
    pack_id: PackId,
    template_id: str | None = None,
) -> TemplateEntitlements:
    slots = SLOTS_BY_PACK[pack_id]
    row = rest_rpc(
        "grant_template_pack",
        {
            "p_user_id": user_id,
            "p_pack_id": pack_id,
            "p_slots": slots,
            "p_all_ids": list(PREMIUM_TEMPLATE_IDS) if slots < 0 else [],
        },
    )
    entitlements = (
        _from_row(row) if isinstance(row, dict) and row else get_entitlements(user_id)
    )
    if template_id:
        unlocked, entitlements = unlock_template(user_id, template_id)
        if not unlocked:
            return entitlements
    return entitlements


def unlock_template(user_id: str, template_id: str) -> tuple[bool, TemplateEntitlements]:
    if template_id not in PREMIUM_TEMPLATE_IDS:
        return False, get_entitlements(user_id)
    row = rest_rpc(
        "unlock_premium_template",
        {"p_user_id": user_id, "p_template_id": template_id},
    )
    if not isinstance(row, dict):
        return False, get_entitlements(user_id)
    entitlements = _from_row(row)
    return bool(row.get("unlocked")), entitlements


def unlock_customization(user_id: str) -> TemplateEntitlements:
    """Flat $1 purchase: colors/fonts/layout on free templates, account-wide."""
    row = rest_rpc("unlock_customization", {"p_user_id": user_id})
    if not isinstance(row, dict) or not row:
        return get_entitlements(user_id)
    return _from_row(row)


def purchase_premium_template(
    user_id: str, template_id: str
) -> tuple[bool, TemplateEntitlements]:
    """Flat $1.99 purchase: owns this one premium template outright, with its
    own customization, independent of pack slots."""
    if template_id not in PREMIUM_TEMPLATE_IDS:
        return False, get_entitlements(user_id)
    row = rest_rpc(
        "purchase_premium_template",
        {"p_user_id": user_id, "p_template_id": template_id},
    )
    if not isinstance(row, dict) or not row:
        return False, get_entitlements(user_id)
    return True, _from_row(row)
