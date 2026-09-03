from app.schemas.payments import PaymentRecord, RecordPaymentRequest
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
    row = rest_rpc(
        "record_payment",
        {
            "p_user_id": user_id,
            "p_pack_id": body.pack_id,
            "p_pack_name": body.pack_name,
            "p_provider": body.provider,
            "p_amount_cents": body.amount_cents,
            "p_currency": body.currency,
            "p_external_transaction_id": body.external_transaction_id,
        },
    )
    if not isinstance(row, dict) or not row:
        raise ValueError("Payment record was not returned by the database")
    return _from_row(row)


def list_payments(user_id: str) -> list[PaymentRecord]:
    response = rest_get(
        f"payments?user_id=eq.{user_id}&select=*&order=created_at.desc"
    )
    rows = response.json()
    return [_from_row(row) for row in rows]