"""
Smart Rewrite: takes text the user already wrote (a summary, a job
achievement, an education note) and asks Gemini to rewrite it to sound
more professional and impactful, while keeping the same facts.

If Gemini fails, we fall back to returning the user's original text
unchanged (source="fallback") rather than showing an error - editing text
is not critical enough to block the user over.
"""

import json
import logging
import re
from functools import lru_cache

from app.schemas.smart_rewrite import (
    RewriteFieldType,
    RewriteVariation,
    SmartRewriteResponse,
)
from app.services.ai_provider import generate_text

logger = logging.getLogger(__name__)

_RESUME_WRITING_RULES = """You are an expert resume writer and ATS (Applicant
Tracking System) optimization specialist. You turn weak, vague resume text
into strong, professional, achievement-focused statements.

Follow these rules strictly:
1. Start each statement with a strong past/present-tense action verb (e.g.
   "Led", "Built", "Reduced", "Managed", "Designed") - never with weak
   phrases like "Responsible for", "Worked on", "Helped with", "Was in
   charge of", or "Duties included".
2. Focus on IMPACT and RESULTS, not just duties. If the original text
   contains any numbers, percentages, team sizes, or timeframes, keep them
   and make them prominent (e.g. "increased sales by 20%" not "helped
   increase sales").
3. If the original text has no numbers, do NOT invent fake ones - instead
   sharpen the language to sound outcome-oriented without fabricating
   metrics (e.g. "Streamlined the onboarding process, cutting new-hire
   ramp-up time" is fine without a specific %, but never invent "by 35%"
   if that number wasn't given).
4. Cut filler words and vague corporate jargon ("various", "many",
   "things", "stuff", "in charge of various tasks").
5. Keep it truthful - never invent companies, job titles, dates, or
   accomplishments that are not implied by the original text.

Example of a weak statement -> strong statement transformation:
Weak: "Responsible for managing a team and handling customer complaints"
Strong: "Led a 5-person team and resolved customer complaints, improving
satisfaction scores"

Weak: "Helped with organizing events for the company"
Strong: "Coordinated company-wide events, streamlining logistics and
vendor communication"
"""

_FIELD_INSTRUCTIONS: dict[RewriteFieldType, str] = {
    "summary": (
        "This is a resume SUMMARY (a short intro paragraph about the "
        "candidate, not a bullet point). Rewrite it as 2-4 confident, "
        "professional sentences that highlight the candidate's strengths "
        "and career focus. Do not use bullet points here - it should read "
        "as flowing sentences."
    ),
    "experience": (
        "This is a WORK ACHIEVEMENT / responsibility on a resume. Rewrite "
        "it as a strong, achievement-focused bullet-style statement "
        "following the rules above."
    ),
    "education": (
        "This is an EDUCATION section note on a resume (coursework, "
        "honors, activities, thesis work). Rewrite it to sound clear, "
        "professional, and achievement-focused where possible, while "
        "staying brief."
    ),
}


def _strip_html(html: str) -> str:
    """Removes HTML tags, leaving plain text. We send the AI plain text
    only - asking it to preserve/reproduce HTML tags is unreliable,
    especially for smaller local models, which can generate broken/
    unclosed tags. The chosen result gets wrapped in a simple <p> when
    sent back to the frontend instead."""
    text = re.sub(r"<[^>]*>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def _build_prompt(field_type: RewriteFieldType, text: str) -> str:
    instructions = _FIELD_INSTRUCTIONS[field_type]
    plain_text = _strip_html(text)
    return f"""{_RESUME_WRITING_RULES}

Task for this request:
{instructions}

Do not invent new facts, companies, dates, or numbers that aren't already
in or clearly implied by the original text. Respond in PLAIN TEXT only -
no HTML tags, no markdown formatting, no asterisks for bold.

Original text:
\"\"\"{plain_text}\"\"\"

Give exactly 3 different rewritten versions, all following the rules
above, but each with a distinct flavor so the user has real options:
1. One CONCISE version - as tight and punchy as possible.
2. One DETAILED version - slightly longer, spelling out scope/impact more.
3. One RESULTS-FOCUSED version - leans hardest into outcomes and impact.

Label each version with a short 1-3 word tag matching its style (e.g.
"Concise", "Detailed", "Results-focused").

Respond with ONLY strict JSON, no markdown fences, in this exact shape:
{{"variations": [{{"label": "...", "text": "..."}}, {{"label": "...", "text": "..."}}, {{"label": "...", "text": "..."}}]}}
"""


def _parse_variations(raw_variations: list) -> list[RewriteVariation]:
    """Parses the AI's 'variations' list into RewriteVariation objects.

    Handles two shapes gracefully, since smaller/local models don't always
    follow formatting instructions as precisely as Gemini does:
      - the requested shape: [{"label": "...", "text": "..."}, ...]
      - a simpler shape some models fall back to: ["plain text", ...]
    """
    parsed: list[RewriteVariation] = []
    default_labels = ["Concise", "Detailed", "Results-focused"]

    for i, v in enumerate(raw_variations):
        if isinstance(v, dict):
            text = str(v.get("text", "")).strip()
            label = str(v.get("label", "")).strip() or (
                default_labels[i] if i < len(default_labels) else f"Option {i + 1}"
            )
        elif isinstance(v, str):
            text = v.strip()
            label = default_labels[i] if i < len(default_labels) else f"Option {i + 1}"
        else:
            continue

        # Safety net: strip any stray/broken HTML the AI might still add
        # despite being asked for plain text, then wrap cleanly in <p> so
        # it displays correctly in the rich text editor.
        clean_text = _strip_html(text)
        if clean_text:
            parsed.append(RewriteVariation(label=label, text=f"<p>{clean_text}</p>"))

    return parsed


def rewrite_text(field_type: RewriteFieldType, text: str) -> SmartRewriteResponse:
    return _cached_rewrite_text(field_type, text)


@lru_cache(maxsize=256)
def _cached_rewrite_text(
    field_type: RewriteFieldType, text: str
) -> SmartRewriteResponse:
    """Cached so re-testing the exact same text doesn't burn extra Gemini
    quota - handy while developing/free-tier testing. Cache lives only in
    memory, so it resets whenever the server restarts, and only kicks in
    for byte-for-byte identical (field_type, text) pairs."""
    try:
        raw_text = generate_text(
            _build_prompt(field_type, text),
            json_mode=True,
            temperature=0.6,
            max_output_tokens=2500,
            thinking_budget=1024,
        )
        data = json.loads(raw_text)
        variations = _parse_variations(data.get("variations", []))
        if not variations:
            raise ValueError("AI returned no usable variations")

        return SmartRewriteResponse(variations=variations[:3], source="gemini")
    except Exception:
        logger.exception("Smart Rewrite call failed, returning original text")
        return SmartRewriteResponse(
            variations=[RewriteVariation(label="Original", text=text)],
            source="fallback",
        )
