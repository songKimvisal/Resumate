import json
import logging
import re
from functools import lru_cache
from typing import Literal

from app.schemas.smart_rewrite import (
    RewriteFieldType,
    RewriteResult,
    RewriteVariation,
)
from app.services.ai_provider import generate_text

logger = logging.getLogger(__name__)

RewriteLanguage = Literal["en", "km"]

_KHMER_CHAR_RE = re.compile(r"[ក-៿᧠-᧿]")
_LATIN_CHAR_RE = re.compile(r"[A-Za-z]")


def _detect_language(text: str) -> RewriteLanguage:
    """Khmer when Khmer characters outnumber Latin letters, so Khmer text that
    mentions a few English terms ("Excel", "ABA Bank") still counts as Khmer."""
    khmer = len(_KHMER_CHAR_RE.findall(text))
    latin = len(_LATIN_CHAR_RE.findall(text))
    return "km" if khmer > latin else "en"

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


_DEFAULT_LABELS: dict[RewriteLanguage, list[str]] = {
    "en": ["Concise", "Detailed", "Results-focused"],
    "km": ["ខ្លីខ្លឹម", "លម្អិត", "ផ្តោតលើលទ្ធផល"],
}

_ORIGINAL_LABEL: dict[RewriteLanguage, str] = {
    "en": "Original",
    "km": "អត្ថបទដើម",
}

_LANGUAGE_INSTRUCTIONS: dict[RewriteLanguage, str] = {
    "en": "Write every rewritten version and every label in English.",
    "km": (
        "The original text is written in KHMER. Write every rewritten version "
        "AND every label in Khmer - do NOT translate into English. Use formal, "
        "professional Khmer suited to a resume in Cambodia. Keep names of "
        "people, companies, schools, products and technical terms (e.g. "
        '"Excel", "Python", "ABA Bank") exactly as the user wrote them. Apply '
        "the rules above naturally in Khmer: open with a strong Khmer action "
        'verb (e.g. "ដឹកនាំ", "គ្រប់គ្រង", "បង្កើត", "កាត់បន្ថយ") instead of '
        'weak phrases like "ទទួលខុសត្រូវលើ" or "ជួយ".'
    ),
}


def _strip_html(html: str) -> str:
    """Strip HTML tags - local models don't reproduce them reliably."""
    text = re.sub(r"<[^>]*>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def _build_prompt(
    field_type: RewriteFieldType, plain_text: str, language: RewriteLanguage
) -> str:
    instructions = _FIELD_INSTRUCTIONS[field_type]
    label_examples = ", ".join(f'"{label}"' for label in _DEFAULT_LABELS[language])
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
{label_examples}).

LANGUAGE: {_LANGUAGE_INSTRUCTIONS[language]}

Respond with ONLY strict JSON, no markdown fences, in this exact shape:
{{"variations": [{{"label": "...", "text": "..."}}, {{"label": "...", "text": "..."}}, {{"label": "...", "text": "..."}}]}}
"""


def _parse_variations(
    raw_variations: list, language: RewriteLanguage
) -> list[RewriteVariation]:
    """Handles both the requested [{label, text}] shape and a plain list
    of strings, since local models don't always follow the format. Drops
    any version that came back in the wrong language."""
    parsed: list[RewriteVariation] = []
    default_labels = _DEFAULT_LABELS[language]

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

        # strip stray HTML the model might still add, wrap in <p> for the editor
        clean_text = _strip_html(text)
        if not clean_text or _detect_language(clean_text) != language:
            continue
        parsed.append(RewriteVariation(label=label, text=f"<p>{clean_text}</p>"))

    return parsed


def rewrite_text(field_type: RewriteFieldType, text: str) -> RewriteResult:
    return _cached_rewrite_text(field_type, text)


@lru_cache(maxsize=256)
def _cached_rewrite_text(
    field_type: RewriteFieldType, text: str
) -> RewriteResult:
    """In-memory cache to avoid re-spending quota on identical requests."""
    plain_text = _strip_html(text)
    language = _detect_language(plain_text)
    try:
        raw_text = generate_text(
            _build_prompt(field_type, plain_text, language),
            json_mode=True,
            temperature=0.6,
            max_output_tokens=4500 if language == "km" else 2500,
            thinking_budget=1024,
        )
        data = json.loads(raw_text)
        variations = _parse_variations(data.get("variations", []), language)
        if not variations:
            raise ValueError(f"AI returned no usable variations in {language!r}")

        return RewriteResult(variations=variations[:3], source="gemini")
    except Exception:
        logger.exception("Smart Rewrite call failed, returning original text")
        return RewriteResult(
            variations=[RewriteVariation(label=_ORIGINAL_LABEL[language], text=text)],
            source="fallback",
        )
