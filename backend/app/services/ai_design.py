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


# Sidebar layouts fill out a short resume with skills and languages; a long
# work history reads better in a single column.
_EXPERIENCE_LAYOUT: dict[str, str] = {
    "fresh": "sidebar",
    "junior": "sidebar",
    "mid": "classic",
    "senior": "classic",
}


def _score(candidate: TemplateMeta, answers: AiAnswers) -> int:
    """Weighted so each tier only breaks ties in the one above it: industry
    first, then the vibes the user picked, then what suits their experience."""
    industry = candidate.industry == _INDUSTRY_MATCH.get(answers.industry, answers.industry)
    vibes = len(set(answers.vibe) & set(candidate.vibes))
    hint_vibes = _EXPERIENCE_VIBE_HINTS.get(answers.experience, [])
    experience_fit = len(set(hint_vibes) & set(candidate.vibes))
    experience_fit += candidate.layout == _EXPERIENCE_LAYOUT.get(answers.experience)
    return industry * 100 + vibes * 10 + experience_fit


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
