from typing import Literal

from pydantic import BaseModel, Field

PackId = Literal[
    "design",
    "ai-basic",
    "ai-plus",
    "ai-pro",
    "both-starter",
    "both-standard",
    "both-everything",
]


class PdfBalance(BaseModel):
    total: int = Field(ge=0)
    used: int = Field(ge=0)
    remaining: int = Field(ge=0)


class ConsumePdfResult(PdfBalance):
    consumed: bool


class GrantPdfsRequest(BaseModel):
    pack_id: PackId
