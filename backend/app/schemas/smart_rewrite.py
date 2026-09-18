from typing import Annotated, Literal
from pydantic import BaseModel, Field
from app.schemas.credits import CreditBalance

RewriteFieldType = Literal["summary", "experience", "education"]


class SmartRewriteRequest(BaseModel):
    field_type: RewriteFieldType
    text: str = Field(min_length=1, max_length=4000)
    # Suggestions the user already saw for this same text; the model is told to avoid them.
    previous: list[Annotated[str, Field(max_length=4000)]] = Field(
        default_factory=list, max_length=6
    )


class RewriteVariation(BaseModel):
    label: str
    text: str


class RewriteResult(BaseModel):
    variations: list[RewriteVariation] = Field(min_length=1, max_length=3)
    source: Literal["gemini", "fallback"]


class SmartRewriteResponse(RewriteResult):
    credits: CreditBalance
