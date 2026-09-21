"""What a paid checkout grants."""

from typing import NamedTuple

from app.services.analyses import analyses_for_pack
from app.services.credits import CREDITS_BY_PACK, credits_for_pack
from app.services.pdfs import pdfs_for_pack
from app.services.pricing import (
    CUSTOMIZATION_UNLOCK_SKU,
    TEMPLATE_SKU_PREFIX,
    UnknownSku,
)
from app.services.templates import PREMIUM_TEMPLATE_IDS, SLOTS_BY_PACK


class GrantSpec(NamedTuple):
    """Everything `sku` is worth. `slots` of -1 means every template."""

    credits: int = 0
    analyses: int = 0
    pdfs: int = 0
    slots: int | None = None
    all_template_ids: tuple[str, ...] = ()
    template_id: str | None = None
    unlock_customization: bool = False


def grants_for_sku(sku: str) -> GrantSpec:
    """What `sku` includes. Raises UnknownSku for anything we do not sell."""
    if sku in CREDITS_BY_PACK:
        slots = SLOTS_BY_PACK[sku]  # type: ignore[index]
        return GrantSpec(
            credits=credits_for_pack(sku),  # type: ignore[arg-type]
            analyses=analyses_for_pack(sku),  # type: ignore[arg-type]
            pdfs=pdfs_for_pack(sku),  # type: ignore[arg-type]
            slots=slots,
            all_template_ids=PREMIUM_TEMPLATE_IDS if slots < 0 else (),
        )

    if sku == CUSTOMIZATION_UNLOCK_SKU:
        return GrantSpec(unlock_customization=True)

    if sku.startswith(TEMPLATE_SKU_PREFIX):
        template_id = sku[len(TEMPLATE_SKU_PREFIX) :]
        if template_id not in PREMIUM_TEMPLATE_IDS:
            raise UnknownSku(f"'{template_id}' is not a premium template")
        return GrantSpec(template_id=template_id)

    raise UnknownSku(f"Nothing to grant for SKU '{sku}'")
