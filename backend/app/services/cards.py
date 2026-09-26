"""Saved PayWay cards. The token never leaves the backend."""

from typing import NamedTuple

from app.services.payway import SavedToken
from app.services.supabase_rest import rest_get, rest_insert, rest_patch


class SavedCard(NamedTuple):
    id: str
    user_id: str
    request_id: str
    status: str
    pwt: str | None
    brand: str | None
    masked_number: str | None
    expires_at: str | None


_COLUMNS = "id,user_id,request_id,status,pwt,brand,masked_number,expires_at"


def _from_row(row: dict) -> SavedCard:
    return SavedCard(
        id=str(row.get("id")),
        user_id=str(row.get("user_id")),
        request_id=row.get("request_id") or "",
        status=row.get("status") or "pending",
        pwt=row.get("pwt"),
        brand=row.get("brand"),
        masked_number=row.get("masked_number"),
        expires_at=row.get("expires_at"),
    )


def _one(query: str) -> SavedCard | None:
    rows = rest_get(f"payment_cards?{query}&select={_COLUMNS}&limit=1").json()
    return _from_row(rows[0]) if isinstance(rows, list) and rows else None


def create_pending_card(user_id: str, request_id: str) -> None:
    rest_insert("payment_cards", {"user_id": user_id, "request_id": request_id})


def list_active_cards(user_id: str) -> list[SavedCard]:
    rows = rest_get(
        f"payment_cards?user_id=eq.{user_id}&status=eq.active"
        f"&select={_COLUMNS}&order=created_at.desc"
    ).json()
    return [_from_row(row) for row in rows] if isinstance(rows, list) else []


def card_by_request(request_id: str, user_id: str | None = None) -> SavedCard | None:
    owner = f"&user_id=eq.{user_id}" if user_id else ""
    return _one(f"request_id=eq.{request_id}{owner}")


def card_by_id(card_id: str, user_id: str) -> SavedCard | None:
    return _one(f"id=eq.{card_id}&user_id=eq.{user_id}&status=eq.active")


def activate_card(request_id: str, token: SavedToken) -> None:
    rest_patch(
        f"payment_cards?request_id=eq.{request_id}",
        {
            "status": "active",
            "pwt": token.pwt,
            "brand": token.brand,
            "masked_number": token.masked_number,
            "expires_at": token.expires_at,
        },
    )


def mark_card_removed(card_id: str) -> None:
    rest_patch(f"payment_cards?id=eq.{card_id}", {"status": "removed", "pwt": None})
