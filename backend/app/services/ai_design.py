"""
AI Design feature: picks the best-fit resume template(s) for a user's
answers, constrained to the template list the frontend sends us.

Gemini is asked to return ONLY a template id it was given plus a short
reasoning string, in strict JSON - we validate that id actually exists
before trusting it. If the Gemini call fails, times out, or returns
something we can't validate, we fall back to a simple local scoring
heuristic so the feature still works (just without AI-generated reasoning).
"""

import json
import logging

from app.schemas.ai_design import AiAnswers, AiDesignResponse, TemplateMeta
from app.services.ai_provider import generate_text

logger = logging.getLogger(__name__)

# Simple in-memory cache so re-testing the same answers doesn't burn extra
# Gemini quota - handy while developing/free-tier testing. Resets whenever
# the server restarts. Capped at 100 entries so it can't grow forever.
_recommendation_cache: dict[str, AiDesignResponse] = {}
_CACHE_MAX_SIZE = 100

_EXPERIENCE_VIBE_HINTS: dict[str, list[str]] = {
    "fresh": ["friendly", "cleanMinimal"],
    "junior": ["cleanMinimal", "modernCreative"],
    "mid": ["professional", "boldConfident"],
    "senior": ["elegantRefined", "professional"],
}


def _fallback_score(candidate: TemplateMeta, answers: AiAnswers) -> int:
    """Python port of the frontend's scoreTemplate() in data/templates/index.ts,
    used only if the Gemini call fails."""
    score = 0
    if candidate.industry == answers.industry:
        score += 4
    score += len(set(answers.vibe) & set(candidate.vibes)) * 2
    hint_vibes = _EXPERIENCE_VIBE_HINTS.get(answers.experience, [])
    score += len(set(hint_vibes) & set(candidate.vibes))
    return score


def _fallback_recommendation(
    answers: AiAnswers, templates: list[TemplateMeta]
) -> AiDesignResponse:
    ranked = sorted(templates, key=lambda t: _fallback_score(t, answers), reverse=True)
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
        source="fallback",
    )


def _build_prompt(answers: AiAnswers, templates: list[TemplateMeta]) -> str:
    template_lines = "\n".join(
        f"- id={t.id}, industry={t.industry}, layout={t.layout}, vibes={t.vibes}"
        for t in templates
    )
    return f"""You are picking a resume template design for a job seeker.

User's answers:
- Target industry: {answers.industry}
- Experience level: {answers.experience}
- Desired style/vibe: {", ".join(answers.vibe)}

Available templates (you MUST pick ids only from this list):
{template_lines}

Pick the single best-fit "primary" template id, and a "sibling" template id
(a good alternate layout, ideally same industry but a different layout).
Respond with ONLY strict JSON, no markdown fences, in this exact shape:
{{"primary_template_id": "...", "sibling_template_id": "...", "reasoning": "one short friendly sentence explaining the pick to the user"}}
"""


def _cache_key(answers: AiAnswers, templates: list[TemplateMeta]) -> str:
    template_ids = sorted(t.id for t in templates)
    return json.dumps(
        {
            "industry": answers.industry,
            "experience": answers.experience,
            "vibe": sorted(answers.vibe),
            "template_ids": template_ids,
        },
        sort_keys=True,
    )


def get_ai_design_recommendation(
    answers: AiAnswers, templates: list[TemplateMeta]
) -> AiDesignResponse:
    cache_key = _cache_key(answers, templates)
    if cache_key in _recommendation_cache:
        return _recommendation_cache[cache_key]

    valid_ids = {t.id for t in templates}

    try:
        raw_text = generate_text(
            _build_prompt(answers, templates),
            json_mode=True,
            temperature=0.4,
            max_output_tokens=200,
            thinking_budget=0,
        )
        data = json.loads(raw_text)

        primary_id = data["primary_template_id"]
        sibling_id = data["sibling_template_id"]
        reasoning = data["reasoning"]

        if primary_id not in valid_ids or sibling_id not in valid_ids:
            raise ValueError(
                f"AI returned ids outside the provided template list: "
                f"{primary_id=}, {sibling_id=}"
            )

        result = AiDesignResponse(
            primary_template_id=primary_id,
            sibling_template_id=sibling_id,
            reasoning=reasoning,
            source="gemini",
        )
    except Exception:
        logger.exception("AI Design call failed, using fallback scorer")
        result = _fallback_recommendation(answers, templates)

    if len(_recommendation_cache) >= _CACHE_MAX_SIZE:
        _recommendation_cache.pop(next(iter(_recommendation_cache)))
    _recommendation_cache[cache_key] = result
    return result
