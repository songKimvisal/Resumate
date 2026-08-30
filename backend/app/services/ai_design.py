"""
Smart design picker: scores templates against the user's 3 answers.
No AI call — this is not part of the credit / Gemini business model.
"""

from app.schemas.ai_design import AiAnswers, AiDesignResponse, TemplateMeta

_INDUSTRY_MATCH: dict[str, str] = {
    "banking": "banking",
    "ngo": "ngo",
    "tech": "tech",
    "hospitality": "hospitality",
    "freshgrad": "freshgrad",
    "designer": "designer",
    "government": "banking",
}

_EXPERIENCE_VIBE_HINTS: dict[str, list[str]] = {
    "fresh": ["friendly", "cleanMinimal"],
    "junior": ["cleanMinimal", "modernCreative"],
    "mid": ["professional", "boldConfident"],
    "senior": ["elegantRefined", "professional"],
}


def _score(candidate: TemplateMeta, answers: AiAnswers) -> int:
    score = 0
    if candidate.industry == _INDUSTRY_MATCH.get(answers.industry, answers.industry):
        score += 4
    score += len(set(answers.vibe) & set(candidate.vibes)) * 2
    hint_vibes = _EXPERIENCE_VIBE_HINTS.get(answers.experience, [])
    score += len(set(hint_vibes) & set(candidate.vibes))
    return score


def get_ai_design_recommendation(
    answers: AiAnswers, templates: list[TemplateMeta]
) -> AiDesignResponse:
    ranked = sorted(templates, key=lambda t: _score(t, answers), reverse=True)
    primary = ranked[0]
    sibling = next(
        (t for t in ranked if t.industry == primary.industry and t.layout != primary.layout),
        next((t for t in ranked if t.layout != primary.layout), primary),
    )
    return AiDesignResponse(
        primary_template_id=primary.id,
        sibling_template_id=sibling.id,
        reasoning=(
            f"Matched based on {answers.industry} industry and your selected style "
            f"preferences."
        ),
        source="local",
    )
