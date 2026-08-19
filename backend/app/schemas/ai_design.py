from typing import Literal

from pydantic import BaseModel, Field

AiIndustryAnswer = Literal[
    "banking", "ngo", "tech", "hospitality", "freshgrad", "designer", "government"
]
AiExperienceAnswer = Literal["fresh", "junior", "mid", "senior"]


class AiAnswers(BaseModel):
    industry: AiIndustryAnswer
    experience: AiExperienceAnswer
    vibe: list[str] = Field(min_length=1)


class TemplateMeta(BaseModel):
    """Mirrors the shape of a TemplatePreset from the frontend's
    data/templates - only the fields Gemini needs to reason about, not the
    full styling/customization payload."""

    id: str
    industry: str
    layout: str
    vibes: list[str]


class AiDesignRequest(BaseModel):
    answers: AiAnswers
    # Only premium templates should be sent - free ones aren't valid picks
    # for this feature, matching the frontend's recommendTemplates() logic.
    templates: list[TemplateMeta] = Field(min_length=1)


class AiDesignResponse(BaseModel):
    primary_template_id: str
    sibling_template_id: str
    reasoning: str
    source: Literal["gemini", "fallback"]
