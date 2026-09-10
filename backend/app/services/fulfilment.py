"""What a paid checkout grants.

One place turns a SKU into entitlements, so the KHQR path (granted by the
server once Bakong confirms the money) and the mocked Stripe path can never
drift apart on what a pack contains.

A pack grants template *slots*, not a specific template: the shopper picks
which one through `/api/templates/unlock`, which already refuses to unlock
more templates than the slots paid for.
"""

import logging

from app.services import analyses, credits, pdfs, templates
from app.services.credits import CREDITS_BY_PACK
from app.services.pricing import (
    CUSTOMIZATION_UNLOCK_SKU,
    TEMPLATE_SKU_PREFIX,
    UnknownSku,
)

logger = logging.getLogger(__name__)


class FulfilmentFailed(RuntimeError):
    """A grant that should have worked did not. Transient - worth retrying,
    unlike UnknownSku, which means we simply do not sell that SKU."""


def fulfil_sku(user_id: str, sku: str) -> None:
    """Grant everything `sku` includes. Raises UnknownSku for anything else."""
    if sku in CREDITS_BY_PACK:
        credits.grant_for_pack(user_id, sku)  # type: ignore[arg-type]
        analyses.grant_for_pack(user_id, sku)  # type: ignore[arg-type]
        pdfs.grant_for_pack(user_id, sku)  # type: ignore[arg-type]
        templates.grant_for_pack(user_id, sku)  # type: ignore[arg-type]
        logger.info("Fulfilled pack %s for user %s", sku, user_id)
        return

    if sku == CUSTOMIZATION_UNLOCK_SKU:
        templates.unlock_customization(user_id)
        logger.info("Fulfilled customization unlock for user %s", user_id)
        return

    if sku.startswith(TEMPLATE_SKU_PREFIX):
        template_id = sku[len(TEMPLATE_SKU_PREFIX) :]
        if template_id not in templates.PREMIUM_TEMPLATE_IDS:
            raise UnknownSku(f"'{template_id}' is not a premium template")
        purchased, _ = templates.purchase_premium_template(user_id, template_id)
        if not purchased:
            raise FulfilmentFailed(f"Could not grant template '{template_id}'")
        logger.info("Fulfilled template %s for user %s", template_id, user_id)
        return

    raise UnknownSku(f"Nothing to grant for SKU '{sku}'")
