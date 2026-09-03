from typing import Literal

from pydantic import BaseModel, Field

Provider = Literal["stripe", "khqr"]


class RecordPaymentRequest(BaseModel):
    # A real PackId for pack purchases, or a flat-purchase SKU string
    # ("customization-unlock", "template:<template_id>") for the one-time
    # $1/$1.99 a-la-carte purchases that aren't part of the pack system.
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