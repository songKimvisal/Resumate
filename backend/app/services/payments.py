from typing import NamedTuple

from app.schemas.payments import PaymentRecord, RecordPaymentRequest
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
    """The amount written to history is the server's price for the SKU, not
    whatever the browser claimed it paid."""
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

class KhqrClaim(NamedTuple):
    """Outcome of trying to claim a Bakong-confirmed payment.

    `claimed` is true for exactly one caller - that caller owes the grants.
    `known` says the md5 is a checkout of this user's at all, which separates
    "already fulfilled" from "not yours / never created here".
    """

    claimed: bool
    known: bool
    sku: str | None


def create_khqr_intent(
    user_id: str,
    sku: str,
    pack_name: str,
    amount_cents: int,
    currency: str,
    md5: str,
) -> None:
    """Remember what this QR was minted for, so the server can fulfil it later
    without the browser telling it what was bought."""
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


def claim_khqr_payment(user_id: str, md5: str) -> KhqrClaim:
    row = rest_rpc("claim_khqr_payment", {"p_user_id": user_id, "p_md5": md5})
    if not isinstance(row, dict):
        return KhqrClaim(claimed=False, known=False, sku=None)
    payment = row.get("payment")
    sku = payment.get("pack_id") if isinstance(payment, dict) else None
    return KhqrClaim(
        claimed=bool(row.get("claimed")),
        known=bool(row.get("known")),
        sku=sku,
    )


def release_khqr_payment(user_id: str, md5: str) -> None:
    """Hand a claim back when the grants that followed it failed, so the next
    poll retries instead of leaving a paid shopper empty-handed."""
    rest_rpc("release_khqr_payment", {"p_user_id": user_id, "p_md5": md5})
