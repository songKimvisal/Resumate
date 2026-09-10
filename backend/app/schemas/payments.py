from typing import Literal

from pydantic import BaseModel, Field

Provider = Literal["stripe", "khqr"]


class RecordPaymentRequest(BaseModel):
    """The amount is not accepted from the browser - the server prices the SKU."""

    pack_id: str = Field(min_length=1)
    pack_name: str
    provider: Provider
    external_transaction_id: str | None = None


class PaymentRecord(BaseModel):
    id: str
    pack_id: str
    pack_name: str
    provider: Provider
    amount_cents: int
    currency: str
    status: Literal["pending", "succeeded", "failed"]
    external_transaction_id: str | None
    created_at: str


class PaymentHistory(BaseModel):
    payments: list[PaymentRecord]


class CreateKhqrRequest(BaseModel):
    """Same rule as above: the QR is generated for the server's price."""

    pack_id: str = Field(min_length=1)
    pack_name: str


class CreateKhqrResponse(BaseModel):
    qr_string: str
    md5: str
    amount_cents: int
    currency: str


class KhqrStatusResponse(BaseModel):
    """`fulfilled` means the server has already granted this checkout. When it
    is False on a paid QR, this server could not fulfil it (no intent row) and
    the browser falls back to the older client-driven grant."""

    status: Literal["pending", "paid"]
    next_delay_seconds: int
    fulfilled: bool = False
