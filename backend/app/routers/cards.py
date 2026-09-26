import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.config import settings
from app.services.cards import (
    SavedCard,
    activate_card,
    card_by_id,
    card_by_request,
    create_pending_card,
    list_active_cards,
    mark_card_removed,
)
from app.services.payway import (
    PaywayNotConfigured,
    PaywayUnavailable,
    build_link_card,
    ctid_for_user,
    get_token_details,
    link_card_url,
    new_request_id,
    remove_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments/cards", tags=["cards"])

_REQUEST_ID = re.compile(r"^[A-Za-z0-9]{5,24}$")


class CardOut(BaseModel):
    """Never includes the token."""

    id: str
    brand: str
    last4: str
    expires_at: str | None


class CardList(BaseModel):
    enabled: bool
    cards: list[CardOut]


class LinkCardResponse(BaseModel):
    request_id: str
    action_url: str
    fields: dict[str, str]


class SyncCardResponse(BaseModel):
    linked: bool
    card: CardOut | None = None


_BRAND_NAMES = {"MC": "Mastercard", "CUP": "UnionPay"}


def _out(card: SavedCard) -> CardOut:
    digits = re.sub(r"\D", "", card.masked_number or "")
    return CardOut(
        id=card.id,
        brand=_BRAND_NAMES.get(card.brand or "", card.brand or "Card"),
        last4=digits[-4:],
        expires_at=card.expires_at,
    )


def _payway_errors(exc: Exception) -> HTTPException:
    if isinstance(exc, PaywayNotConfigured):
        return HTTPException(status_code=503, detail=str(exc))
    return HTTPException(status_code=502, detail=str(exc))


@router.get("", response_model=CardList)
def read_cards(user: CurrentUser = Depends(get_current_user)) -> CardList:
    return CardList(
        enabled=settings.payway_saved_cards_enabled,
        cards=[_out(card) for card in list_active_cards(user.id)],
    )


@router.post("/link", response_model=LinkCardResponse)
def start_link_card(user: CurrentUser = Depends(get_current_user)) -> LinkCardResponse:
    if not settings.payway_saved_cards_enabled:
        raise HTTPException(
            status_code=503,
            detail="Saved cards are not enabled (PAYWAY_SAVED_CARDS_ENABLED).",
        )
    request_id = new_request_id()
    try:
        fields = build_link_card(request_id=request_id, ctid=ctid_for_user(user.id))
    except PaywayNotConfigured as exc:
        raise _payway_errors(exc) from exc
    create_pending_card(user.id, request_id)
    return LinkCardResponse(request_id=request_id, action_url=link_card_url(), fields=fields)


def _sync(request_id: str, user_id: str | None) -> SavedCard | None:
    """Ask PayWay whether this Link Card request produced a token."""
    card = card_by_request(request_id, user_id)
    if card is None:
        return None
    if card.status == "active":
        return card
    if card.status != "pending":
        return None
    token = get_token_details(request_id)
    if token is None or not token.active:
        return None
    activate_card(request_id, token)
    logger.info("Saved card %s linked for user %s", request_id, card.user_id)
    return card_by_request(request_id, user_id)


@router.post("/sync/{request_id}", response_model=SyncCardResponse)
def sync_card(
    request_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> SyncCardResponse:
    if not _REQUEST_ID.match(request_id):
        raise HTTPException(status_code=400, detail="Invalid request id")
    try:
        card = _sync(request_id, user.id)
    except (PaywayNotConfigured, PaywayUnavailable) as exc:
        raise _payway_errors(exc) from exc
    return SyncCardResponse(linked=card is not None, card=_out(card) if card else None)


@router.post("/callback")
async def link_card_callback(request: Request) -> dict[str, bool]:
    """Untrusted hint: the token is re-read from PayWay, not taken from the body."""
    try:
        body = await request.json()
    except ValueError:
        body = {}
    request_id = str(body.get("request_id", "")) if isinstance(body, dict) else ""
    if not _REQUEST_ID.match(request_id):
        logger.warning("Card callback without a usable request_id")
        return {"ok": False}
    try:
        return {"ok": _sync(request_id, user_id=None) is not None}
    except (PaywayNotConfigured, PaywayUnavailable, HTTPException) as exc:
        logger.error("Card callback for %s could not sync: %s", request_id, exc)
        return {"ok": False}


@router.delete("/{card_id}")
def delete_card(
    card_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, bool]:
    try:
        uuid.UUID(card_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid card id") from exc
    card = card_by_id(card_id, user.id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.pwt:
        try:
            remove_token(ctid_for_user(user.id), card.pwt)
        except (PaywayNotConfigured, PaywayUnavailable) as exc:
            raise _payway_errors(exc) from exc
    mark_card_removed(card.id)
    return {"removed": True}
