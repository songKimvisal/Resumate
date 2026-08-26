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


class CreditBalance(BaseModel):
    total: int = Field(ge=0)
    used: int = Field(ge=0)
    remaining: int = Field(ge=0)


class GrantCreditsRequest(BaseModel):
    pack_id: PackId
