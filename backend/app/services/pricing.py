from app.schemas.credits import PackId
from app.services.templates import PREMIUM_TEMPLATE_IDS


class UnknownSku(ValueError):
    """Raised when a checkout SKU has no server-side price."""


PACK_PRICE_CENTS: dict[PackId, int] = {
    "ai-basic": 299,
    "ai-plus": 399,
    "ai-pro": 499,
    "both-starter": 399,
    "both-standard": 599,
    "both-everything": 699,
}

# Flat, one-time purchases from the "Just templates" lane.
CUSTOMIZATION_UNLOCK_SKU = "customization-unlock"
CUSTOMIZATION_UNLOCK_CENTS = 100
TEMPLATE_SKU_PREFIX = "template:"
PREMIUM_TEMPLATE_CENTS = 199

CURRENCY = "USD"


def price_cents_for_sku(sku: str) -> int:
    """What this SKU costs, in cents. Raises UnknownSku for anything else."""
    if sku in PACK_PRICE_CENTS:
        return PACK_PRICE_CENTS[sku]  # type: ignore[index]
    if sku == CUSTOMIZATION_UNLOCK_SKU:
        return CUSTOMIZATION_UNLOCK_CENTS
    if sku.startswith(TEMPLATE_SKU_PREFIX):
        template_id = sku[len(TEMPLATE_SKU_PREFIX) :]
        if template_id in PREMIUM_TEMPLATE_IDS:
            return PREMIUM_TEMPLATE_CENTS
    raise UnknownSku(f"No server-side price for SKU '{sku}'")
