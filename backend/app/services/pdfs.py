from app.schemas.pdfs import PackId, PdfBalance, ConsumePdfResult
from app.services.supabase_rest import rest_rpc

PDFS_BY_PACK: dict[PackId, int] = {
    "design": 0,
    "ai-basic": 0,
    "ai-plus": 0,
    "ai-pro": 0,
    "both-starter": 1,
    "both-standard": 3,
    "both-everything": 5,
}


def pdfs_for_pack(pack_id: PackId) -> int:
    return PDFS_BY_PACK[pack_id]


def _balance(total: int, used: int) -> PdfBalance:
    return PdfBalance(
        total=max(0, total),
        used=max(0, used),
        remaining=max(0, total - used),
    )


def _from_row(row: dict) -> PdfBalance:
    return _balance(
        int(row.get("pdfs_total", 1) or 1),
        int(row.get("pdfs_used", 0) or 0),
    )


def get_balance(user_id: str) -> PdfBalance:
    row = rest_rpc("get_pdf_saves", {"p_user_id": user_id})
    if isinstance(row, dict) and row:
        return _from_row(row)
    return _balance(1, 0)


def grant_for_pack(user_id: str, pack_id: PackId) -> PdfBalance:
    amount = pdfs_for_pack(pack_id)
    row = rest_rpc(
        "grant_pdf_saves",
        {"p_user_id": user_id, "p_amount": amount},
    )
    if isinstance(row, dict) and row:
        return _from_row(row)
    return get_balance(user_id)


def consume_save(user_id: str) -> tuple[bool, PdfBalance]:
    row = rest_rpc("consume_pdf_save", {"p_user_id": user_id})
    if not isinstance(row, dict):
        return False, get_balance(user_id)
    consumed = bool(row.get("consumed"))
    return consumed, _from_row(row)


def refund_save(user_id: str) -> PdfBalance:
    row = rest_rpc("refund_pdf_save", {"p_user_id": user_id})
    if isinstance(row, dict) and row:
        return _from_row(row)
    return get_balance(user_id)


def consume_result(consumed: bool, balance: PdfBalance) -> ConsumePdfResult:
    return ConsumePdfResult(
        consumed=consumed,
        total=balance.total,
        used=balance.used,
        remaining=balance.remaining,
    )
