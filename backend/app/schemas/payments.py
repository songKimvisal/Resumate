from typing import Literal

from pydantic import BaseModel, Field

Provider = Literal["stripe", "khqr"]


class RecordPaymentRequest(BaseModel):
    pack_id: str = Field(min_length=1)
    pack_name: str
    provider: Provider
    amount_cents: int = Field(ge=0)
    currency: str = "USD"
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
    pack_id: str = Field(min_length=1)
    pack_name: str
    amount_cents: int = Field(ge=1)
    currency: str = "USD"


class CreateKhqrResponse(BaseModel):
    qr_string: str
    md5: str


class KhqrStatusResponse(BaseModel):
    status: Literal["pending", "paid"]
    next_delay_seconds: int