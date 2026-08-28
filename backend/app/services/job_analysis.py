"""One Gemini call for job match, interview questions, and the
readiness report. Later screens reuse the JSON instead of paying again."""

import json
import logging
import re
from functools import lru_cache

from app.schemas.job_analysis import (
    BulletRewrite,
    InterviewQuestion,
    JobAnalysisResult,
    ReadinessCopy,
)
from app.services.ai_provider import generate_text

logger = logging.getLogger(__name__)

_PROMPT = """You are a senior interview coach for Cambodian fresh graduates and early-career job seekers.
Given ONE job ad and ONE resume, return a single JSON object. No markdown.

{{
  "roleTitle": "short job title from the ad",
  "matchScore": 0,
  "matched": ["skill or keyword already on the resume"],
  "missing": ["required skill missing from the resume"],
  "weakSections": ["which resume section is weak for this ad, and why"],
  "qualificationGaps": ["education, years, cert, or language the ad wants but the resume lacks"],
  "strengths": ["what already helps this candidate for this exact role"],
  "bulletRewrites": [
    {{
      "role": "job title or project name from the resume",
      "current": "the original experience bullet, shortened",
      "suggested": "one rewritten bullet, 1 sentence, same facts",
      "keyword": "one missing job keyword woven in, or empty"
    }}
  ],
  "questions": [
    {{
      "id": "q1",
      "category": "behavioral",
      "question": "the exact question an interviewer for THIS job would ask",
      "why": "1-2 sentences: why THIS posting's interviewer asks this, tied to a duty or skill in the ad",
      "angle": "how to structure the answer using THIS resume. Behavioral must use STAR (Situation, Task, Action, Result) and name a real employer, project, or school from the resume.",
      "talkingPoints": ["short point they must say", "second point", "third point"],
      "sampleAnswer": "first-person spoken answer, 2-4 short sentences"
    }}
  ],
  "readiness": {{
    "headline": "...",
    "summary": "2-3 sentences: strengths, what to improve, and whether they should apply yet",
    "actions": ["concrete next step"],
    "readyToApply": false
  }}
}}

Match / report rules (keep these strings short):
- matched/missing: copy named skills from the job ad only. Example for a mobile/web ad: Front-end, iOS, Android, HTML, CSS, Hybrid Development, Photoshop, Illustrator, English. Never return personality or filler: spoken, written, honest, future, skill, tools, design (alone), hybrid (alone), flexible, hardworking, teamwork, pressure. "written & spoken English" is English only. No trailing punctuation.
- matchScore: 0-100 how well the resume covers those real requirements.
- weakSections: 2-4 items (summary, experience bullets, skills, education, projects).
- qualificationGaps: 1-3 items. If none, return [].
- strengths: 2-4 items grounded in the resume.
- bulletRewrites: 2 to 4 items. Rewrite ONE real experience or project bullet per item. Keep the user's facts. Do not invent metrics, employers, or skills they never did. Weave in one missing keyword only if that work could reasonably include it. If the resume has no experience or projects, return [].
- readyToApply: true only if matchScore >= 70 AND major qualification gaps are empty.
- actions: 3 or 4 short next steps (edit resume, practice a question, add a skill).

Interview rules (most important):
- Write for a Cambodian fresh graduate. Short sentences. Everyday words. Easy to say out loud.
- Never use an em dash (—) or en dash (–). Use a period, a comma, or the word "and" or "to".
- Do not use hard words unless you explain them: stakeholder, ramp, intake, workflow, buzzword, maturity, brief.
- questions: EXACTLY 20 unique questions. 8 behavioral, 6 technical, 6 situational. ids q1-q20.
- Behavioral = one past story. Technical = a tool from the ad. Situational = "what would you do if..." for this job.
- Every question must name something from the job ad or the resume (a tool, company, school, or task).
- Never repeat the same question text.
- why: 1 short sentence.
- angle: 1 or 2 short sentences. For behavioral, use STAR in plain words.
- talkingPoints: 2 or 3 very short lines.
- sampleAnswer: first person ("I"). 2 to 4 short spoken sentences. Name a real company, project, school, or tool from the resume. If a skill is missing, be honest.

JOB AD:
\"\"\"{job}\"\"\"

RESUME:
\"\"\"{resume}\"\"\"
"""


_CACHE_VERSION = "job-analysis-skills-v2"

_SKILL_FILLER = {
    "spoken",
    "written",
    "oral",
    "verbal",
    "fluent",
    "native",
    "proficient",
    "tool",
    "tools",
    "software",
    "computer",
    "microsoft",
    "communication",
    "teamwork",
    "skills",
    "skill",
    "ability",
    "knowledge",
    "benefits",
    "salary",
    "honest",
    "future",
    "design",
    "hybrid",
    "developer",
}

_LANG = {
    "english": "English",
    "khmer": "Khmer",
    "chinese": "Chinese",
    "mandarin": "Chinese",
    "french": "French",
    "korean": "Korean",
    "japanese": "Japanese",
    "thai": "Thai",
    "vietnamese": "Vietnamese",
    "spanish": "Spanish",
}


def analyze_job(job_text: str, resume_text: str) -> JobAnalysisResult:
    return _cached_analyze(_CACHE_VERSION, job_text.strip(), resume_text.strip())


@lru_cache(maxsize=64)
def _cached_analyze(_version: str, job_text: str, resume_text: str) -> JobAnalysisResult:
    try:
        raw = generate_text(
            _PROMPT.format(job=job_text[:12000], resume=resume_text[:8000]),
            json_mode=True,
            temperature=0.55,
            max_output_tokens=8192,
            thinking_budget=256,
        )
        data = _parse_json(raw)
        result = _from_payload(data)
        if len(result.questions) < 8:
            raise ValueError("too few interview questions")
        return result
    except Exception:
        logger.exception("Job analysis AI call failed")
        return JobAnalysisResult(
            role_title="",
            match_score=0,
            matched=[],
            missing=[],
            weak_sections=[],
            qualification_gaps=[],
            strengths=[],
            bullet_rewrites=[],
            questions=[],
            readiness=ReadinessCopy(
                headline="", summary="", actions=[], ready_to_apply=False
            ),
            source="fallback",
        )


def _parse_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned).strip()
    return json.loads(cleaned)


def _from_payload(data: dict) -> JobAnalysisResult:
    questions: list[InterviewQuestion] = []
    for i, item in enumerate(data.get("questions") or []):
        if not isinstance(item, dict):
            continue
        category = _normalize_category(item.get("category", "behavioral"))
        question = _plain(item.get("question", ""))
        angle = _plain(item.get("angle", ""))
        if not question:
            continue
        talking = [_plain(p) for p in _string_list(
            item.get("talkingPoints") or item.get("talking_points")
        )[:3] if _plain(p)]
        questions.append(
            InterviewQuestion(
                id=str(item.get("id") or f"q{i + 1}"),
                category=category,  # type: ignore[arg-type]
                question=question,
                angle=angle,
                why=_plain(item.get("why") or ""),
                sample_answer=_plain(
                    item.get("sampleAnswer") or item.get("sample_answer") or ""
                ),
                talking_points=talking,
            )
        )

    readiness_raw = data.get("readiness") or {}
    if not isinstance(readiness_raw, dict):
        readiness_raw = {}
    actions = [
        _plain(a)
        for a in (readiness_raw.get("actions") or [])
        if _plain(a)
    ]
    ready = readiness_raw.get("readyToApply")
    if ready is None:
        ready = readiness_raw.get("ready_to_apply")

    matched = _skill_keywords(data.get("matched"))
    missing = _skill_keywords(data.get("missing"))
    rewrites: list[BulletRewrite] = []
    for item in data.get("bulletRewrites") or data.get("bullet_rewrites") or []:
        if not isinstance(item, dict):
            continue
        suggested = _plain(item.get("suggested") or "")
        if not suggested:
            continue
        keyword = _plain(item.get("keyword") or "")
        if keyword.lower() in _SKILL_FILLER:
            keyword = ""
        rewrites.append(
            BulletRewrite(
                role=_plain(item.get("role") or ""),
                current=_plain(item.get("current") or ""),
                suggested=suggested,
                keyword=keyword,
            )
        )
    try:
        score = int(data.get("matchScore") or data.get("match_score") or 0)
    except (TypeError, ValueError):
        score = 0

    return JobAnalysisResult(
        role_title=str(data.get("roleTitle") or data.get("role_title") or "").strip(),
        match_score=max(0, min(100, score)),
        matched=matched[:8],
        missing=missing[:8],
        weak_sections=_string_list(
            data.get("weakSections") or data.get("weak_sections")
        )[:4],
        qualification_gaps=_string_list(
            data.get("qualificationGaps") or data.get("qualification_gaps")
        )[:3],
        strengths=_string_list(data.get("strengths"))[:4],
        bullet_rewrites=rewrites[:4],
        questions=questions[:20],
        readiness=ReadinessCopy(
            headline=_plain(readiness_raw.get("headline") or ""),
            summary=_plain(readiness_raw.get("summary") or ""),
            actions=actions[:4],
            ready_to_apply=bool(ready),
        ),
        source="gemini",
    )


def _plain(value: object) -> str:
    """Short, readable text. Never keep an em dash."""
    text = str(value or "").strip()
    text = re.sub(r"(\d)\s*[–—]\s*(\d)", r"\1 to \2", text)
    text = re.sub(r"\s*[—]\s*", ". ", text)
    text = re.sub(r"\s*–\s*", ", ", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"\.\s*\.", ".", text)
    return text.strip()


def _normalize_category(value: object) -> str:
    raw = str(value or "behavioral").lower().replace("_", "-")
    if raw == "technical":
        return "technical"
    if raw in ("situational", "role", "role-specific", "rolespecific"):
        return "situational"
    return "behavioral"


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        text = str(item).strip()
        if text:
            out.append(text)
    return out


def _skill_keywords(value: object) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    lang_prefix = re.compile(
        r"^(?:spoken|written|oral|verbal|fluent|native)\s+"
        r"(english|khmer|chinese|mandarin|french|korean|japanese|thai|vietnamese|spanish)$"
    )
    for item in _string_list(value):
        text = re.sub(r"^[.,;:!?()]+|[.,;:!?()]+$", "", _plain(item)).strip()
        low = text.lower().strip()
        prefixed = lang_prefix.match(low)
        if prefixed:
            text = _LANG.get(prefixed.group(1), prefixed.group(1).title())
            low = text.lower()
        elif low in _LANG:
            text = _LANG[low]
            low = text.lower()
        if low in _SKILL_FILLER or len(low) < 2:
            continue
        if low in seen:
            continue
        seen.add(low)
        out.append(text)
    return out
