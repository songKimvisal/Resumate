from app.schemas.credits import CreditBalance, PackId
from app.services.supabase_rest import rest_get, rest_rpc

CREDITS_BY_PACK: dict[PackId, int] = {
    "design": 0,
    "ai-basic": 8,
    "ai-plus": 25,
    "ai-pro": 60,
    "both-starter": 8,
    "both-standard": 25,
    "both-everything": 60,
}


def credits_for_pack(pack_id: PackId) -> int:
    return CREDITS_BY_PACK[pack_id]


def _balance(total: int, used: int) -> CreditBalance:
    return CreditBalance(
        total=max(0, total),
        used=max(0, used),
        remaining=max(0, total - used),
    )


def _from_row(row: dict) -> CreditBalance:
    return _balance(
        int(row.get("credits_total", 0) or 0),
        int(row.get("credits_used", 0) or 0),
    )


def get_balance(user_id: str) -> CreditBalance:
    response = rest_get(
        f"ai_credits?user_id=eq.{user_id}&select=credits_total,credits_used"
    )
    rows = response.json()
    if not rows:
        return _balance(0, 0)
    return _from_row(rows[0])


def grant_for_pack(user_id: str, pack_id: PackId) -> CreditBalance:
    amount = credits_for_pack(pack_id)
    row = rest_rpc(
        "grant_ai_credits",
        {"p_user_id": user_id, "p_amount": amount},
    )
    if isinstance(row, dict) and row:
        return _from_row(row)
    return get_balance(user_id)


def consume_credit(user_id: str) -> tuple[bool, CreditBalance]:
    row = rest_rpc("consume_ai_credit", {"p_user_id": user_id})
    if not isinstance(row, dict):
        return False, get_balance(user_id)
    consumed = bool(row.get("consumed"))
    return consumed, _from_row(row)


def refund_credit(user_id: str) -> CreditBalance:
    row = rest_rpc("refund_ai_credit", {"p_user_id": user_id})
    if isinstance(row, dict) and row:
        return _from_row(row)
    return get_balance(user_id)
