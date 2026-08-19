import json
import logging

from google.genai import types

from app.schemas.ai_design import AiAnswers, AiDesignResponse, TemplateMeta
from app.services.gemini_client import client, MODEL

logger = logging.getLogger(__name__)

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


def get_ai_design_recommendation(
    answers: AiAnswers, templates: list[TemplateMeta]
) -> AiDesignResponse:
    valid_ids = {t.id for t in templates}

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=_build_prompt(answers, templates),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4,
                max_output_tokens=200,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        data = json.loads(response.text)

        primary_id = data["primary_template_id"]
        sibling_id = data["sibling_template_id"]
        reasoning = data["reasoning"]

        if primary_id not in valid_ids or sibling_id not in valid_ids:
            raise ValueError(
                f"Gemini returned ids outside the provided template list: "
                f"{primary_id=}, {sibling_id=}"
            )

        return AiDesignResponse(
            primary_template_id=primary_id,
            sibling_template_id=sibling_id,
            reasoning=reasoning,
            source="gemini",
        )
    except Exception:
        logger.exception("Gemini AI Design call failed, using fallback scorer")
        return _fallback_recommendation(answers, templates)
