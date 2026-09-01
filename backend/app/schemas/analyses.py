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


class AnalysisBalance(BaseModel):
    total: int = Field(ge=0)
    used: int = Field(ge=0)
    remaining: int = Field(ge=0)


class GrantAnalysesRequest(BaseModel):
    pack_id: PackId
