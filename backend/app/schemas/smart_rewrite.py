from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.credits import CreditBalance

# The "kind" of text being rewritten - lets us tailor the AI's instructions
# slightly per field, since a resume summary and a bullet-point achievement
# should be rewritten differently.
RewriteFieldType = Literal["summary", "experience", "education"]


class SmartRewriteRequest(BaseModel):
    field_type: RewriteFieldType
    text: str = Field(min_length=1, max_length=4000)


class RewriteVariation(BaseModel):
    label: str
    text: str


class RewriteResult(BaseModel):
    variations: list[RewriteVariation] = Field(min_length=1, max_length=3)
    source: Literal["gemini", "fallback"]


class SmartRewriteResponse(RewriteResult):
    credits: CreditBalance
