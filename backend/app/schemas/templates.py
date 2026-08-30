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


class TemplateEntitlements(BaseModel):
    pack_id: PackId | None = None
    template_slots: int = 0
    unlocked_template_ids: list[str] = Field(default_factory=list)


class GrantTemplatesRequest(BaseModel):
    pack_id: PackId
    template_id: str | None = None


class UnlockTemplateRequest(BaseModel):
    template_id: str = Field(min_length=1)
