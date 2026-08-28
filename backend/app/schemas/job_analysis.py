from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.credits import CreditBalance

InterviewCategory = Literal["behavioral", "technical", "situational"]


class JobAnalysisRequest(BaseModel):
    job_text: str = Field(min_length=40, max_length=20000)
    resume_text: str = Field(min_length=20, max_length=20000)


class InterviewQuestion(BaseModel):
    id: str
    category: InterviewCategory
    question: str
    angle: str
    why: str = ""
    sample_answer: str = ""
    talking_points: list[str] = Field(default_factory=list)


class ReadinessCopy(BaseModel):
    headline: str
    summary: str
    actions: list[str] = Field(default_factory=list)
    ready_to_apply: bool = False


class BulletRewrite(BaseModel):
    role: str = ""
    current: str = ""
    suggested: str = ""
    keyword: str = ""


class JobAnalysisResult(BaseModel):
    role_title: str
    match_score: int = Field(ge=0, le=100)
    matched: list[str]
    missing: list[str]
    weak_sections: list[str] = Field(default_factory=list)
    qualification_gaps: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    bullet_rewrites: list[BulletRewrite] = Field(default_factory=list)
    questions: list[InterviewQuestion]
    readiness: ReadinessCopy
    source: Literal["gemini", "fallback"] = "gemini"


class JobAnalysisResponse(JobAnalysisResult):
    credits: CreditBalance
