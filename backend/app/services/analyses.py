"""Job-analysis quota: one consume unlocks match, interview set, and skill-gap report."""

from app.schemas.analyses import PackId, AnalysisBalance
from app.services.supabase_rest import rest_rpc

# Same counts as the published pack tables. Design packs add none.
ANALYSES_BY_PACK: dict[PackId, int] = {
    "design": 0,
    "ai-basic": 1,
    "ai-plus": 3,
    "ai-pro": 5,
    "both-starter": 1,
    "both-standard": 3,
    "both-everything": 5,
}


def analyses_for_pack(pack_id: PackId) -> int:
    return ANALYSES_BY_PACK[pack_id]


def _balance(total: int, used: int) -> AnalysisBalance:
    return AnalysisBalance(
        total=max(0, total),
        used=max(0, used),
        remaining=max(0, total - used),
    )


def _from_row(row: dict) -> AnalysisBalance:
    return _balance(
        int(row.get("analyses_total", 0) or 0),
        int(row.get("analyses_used", 0) or 0),
    )


def get_balance(user_id: str) -> AnalysisBalance:
    row = rest_rpc("get_job_analyses", {"p_user_id": user_id})
    if isinstance(row, dict) and row:
        return _from_row(row)
    return _balance(0, 0)


def grant_for_pack(user_id: str, pack_id: PackId) -> AnalysisBalance:
    amount = analyses_for_pack(pack_id)
    row = rest_rpc(
        "grant_job_analyses",
        {"p_user_id": user_id, "p_amount": amount},
    )
    if isinstance(row, dict) and row:
        return _from_row(row)
    return get_balance(user_id)


def consume_analysis(user_id: str) -> tuple[bool, AnalysisBalance]:
    row = rest_rpc("consume_job_analysis", {"p_user_id": user_id})
    if not isinstance(row, dict):
        return False, get_balance(user_id)
    consumed = bool(row.get("consumed"))
    return consumed, _from_row(row)


def refund_analysis(user_id: str) -> AnalysisBalance:
    row = rest_rpc("refund_job_analysis", {"p_user_id": user_id})
    if isinstance(row, dict) and row:
        return _from_row(row)
    return get_balance(user_id)
