from typing import NamedTuple

from app.schemas.payments import PaymentRecord, RecordPaymentRequest
from app.services.fulfilment import GrantSpec
from app.services.pricing import CURRENCY, price_cents_for_sku
from app.services.supabase_rest import rest_get, rest_rpc


def _from_row(row: dict) -> PaymentRecord:
    return PaymentRecord(
        id=str(row.get("id")),
        pack_id=row.get("pack_id", ""),
        pack_name=row.get("pack_name", ""),
        provider=row.get("provider", "stripe"),
        amount_cents=int(row.get("amount_cents", 0) or 0),
        currency=row.get("currency", "USD"),
        status=row.get("status", "succeeded"),
        external_transaction_id=row.get("external_transaction_id"),
        created_at=str(row.get("created_at", "")),
    )


def record_payment(user_id: str, body: RecordPaymentRequest) -> PaymentRecord:
    amount_cents = price_cents_for_sku(body.pack_id)
    row = rest_rpc(
        "record_payment",
        {
            "p_user_id": user_id,
            "p_pack_id": body.pack_id,
            "p_pack_name": body.pack_name,
            "p_provider": body.provider,
            "p_amount_cents": amount_cents,
            "p_currency": CURRENCY,
            "p_external_transaction_id": body.external_transaction_id,
        },
    )
    if not isinstance(row, dict) or not row:
        raise ValueError("Payment record was not returned by the database")
    return _from_row(row)


def list_payments(user_id: str) -> list[PaymentRecord]:
    """History shows money that actually arrived - not abandoned QR codes."""
    response = rest_get(
        f"payments?user_id=eq.{user_id}&status=eq.succeeded"
        "&select=*&order=created_at.desc"
    )
    rows = response.json()
    return [_from_row(row) for row in rows]

class KhqrPayment(NamedTuple):
    """What the database knows about one KHQR checkout."""

    known: bool
    fulfilled: bool
    sku: str | None


def create_khqr_intent(
    user_id: str,
    sku: str,
    pack_name: str,
    amount_cents: int,
    currency: str,
    md5: str,
) -> None:
    rest_rpc(
        "create_khqr_intent",
        {
            "p_user_id": user_id,
            "p_pack_id": sku,
            "p_pack_name": pack_name,
            "p_amount_cents": amount_cents,
            "p_currency": currency,
            "p_md5": md5,
        },
    )


def read_khqr_payment(user_id: str, md5: str) -> KhqrPayment:
    """Look up a checkout, so the SKU comes from the row and not the request."""
    response = rest_get(
        f"payments?external_transaction_id=eq.{md5}&user_id=eq.{user_id}"
        "&select=pack_id,fulfilled_at&limit=1"
    )
    rows = response.json()
    if not isinstance(rows, list) or not rows:
        return KhqrPayment(known=False, fulfilled=False, sku=None)
    row = rows[0]
    return KhqrPayment(
        known=True,
        fulfilled=row.get("fulfilled_at") is not None,
        sku=row.get("pack_id"),
    )


def fulfil_khqr_payment(user_id: str, md5: str, spec: GrantSpec) -> KhqrPayment:
    """Claim and grant atomically. Works for KHQR md5s and PayWay tran_ids."""
    row = rest_rpc(
        "fulfil_khqr_payment",
        {
            "p_user_id": user_id,
            "p_md5": md5,
            "p_credits": spec.credits,
            "p_analyses": spec.analyses,
            "p_pdfs": spec.pdfs,
            "p_slots": spec.slots,
            "p_all_ids": list(spec.all_template_ids),
            "p_template_id": spec.template_id,
            "p_unlock_customization": spec.unlock_customization,
        },
    )
    if not isinstance(row, dict):
        return KhqrPayment(known=False, fulfilled=False, sku=None)
    return KhqrPayment(
        known=bool(row.get("known")),
        fulfilled=bool(row.get("fulfilled")),
        sku=row.get("pack_id"),
    )


class PaywayPayment(NamedTuple):
    """What the database knows about one PayWay card checkout."""

    user_id: str
    sku: str
    amount_cents: int
    fulfilled: bool


def create_payway_intent(
    user_id: str,
    sku: str,
    pack_name: str,
    amount_cents: int,
    currency: str,
    tran_id: str,
) -> None:
    rest_rpc(
        "create_payway_intent",
        {
            "p_user_id": user_id,
            "p_pack_id": sku,
            "p_pack_name": pack_name,
            "p_amount_cents": amount_cents,
            "p_currency": currency,
            "p_tran_id": tran_id,
        },
    )


def read_payway_payment(tran_id: str, user_id: str | None = None) -> PaywayPayment | None:
    """Omit `user_id` only for PayWay's callback."""
    owner = f"&user_id=eq.{user_id}" if user_id else ""
    response = rest_get(
        f"payments?external_transaction_id=eq.{tran_id}&provider=eq.payway{owner}"
        "&select=user_id,pack_id,amount_cents,fulfilled_at&limit=1"
    )
    rows = response.json()
    if not isinstance(rows, list) or not rows:
        return None
    row = rows[0]
    return PaywayPayment(
        user_id=str(row.get("user_id")),
        sku=row.get("pack_id") or "",
        amount_cents=int(row.get("amount_cents", 0) or 0),
        fulfilled=row.get("fulfilled_at") is not None,
    )
