from typing import Literal
from uuid import UUID

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


class PdfStatus(PdfBalance):
    unlocked_resume_ids: list[str] = []


class ConsumePdfRequest(BaseModel):
    resume_id: UUID | None = None


class ConsumePdfResult(PdfBalance):
    consumed: bool
    # False when the resume was already unlocked, so nothing was spent.
    charged: bool = True


class GrantPdfsRequest(BaseModel):
    pack_id: PackId
