import type { Resume } from "../types/resume";
import { BackendError } from "./api/client";
import { creditsFromErrorBody, type CreditBalance } from "./api/credits";
import { requestJobAnalysis } from "./api/jobAnalysis";
import {
  computeJobMatch,
  prettyKeyword,
  requirementKeywords,
  resumePlainText,
  type JobMatchResult,
} from "./jobMatch";
import type {
  InterviewCategory,
  JobAnalysisPack,
} from "../store/journeyStore";
import {
  completeInterviewSet,
  interviewContextFromResume,
} from "./interviewSet";
import { buildFallbackBulletRewrites } from "./bulletRewrites";

export type { InterviewCategory, InterviewQuestion, JobAnalysisPack } from "../store/journeyStore";

const CATEGORIES: InterviewCategory[] = [
  "behavioral",
  "technical",
  "situational",
];

export function normalizeInterviewCategory(value: string): InterviewCategory {
  const raw = value.toLowerCase().replace("_", "-");
  if (raw === "technical") return "technical";
  if (raw === "situational" || raw.includes("role")) return "situational";
  return "behavioral";
}

export function isInterviewCategory(value: string): value is InterviewCategory {
  return CATEGORIES.includes(value as InterviewCategory);
}

export function guessRoleTitle(jobText: string, resume: Resume) {
  const fromResume = resume.personal.jobTitle.trim();
  const firstLine = jobText
    .split(/\n/)
    .map((line) => line.trim())
    .find((line) => line.length >= 4 && line.length <= 80);
  if (firstLine && !/https?:\/\//i.test(firstLine)) return firstLine;
  return fromResume || "this role";
}

/** Plain English for fresh graduates. Never keep an em dash. */
export function plainInterviewText(value: string) {
  return value
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[—]\s*/g, ". ")
    .replace(/\s*–\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

export function withNormalizedQuestions(
  pack: JobAnalysisPack,
  resume?: Resume,
): JobAnalysisPack {
  const normalized: JobAnalysisPack = {
    ...pack,
    questions: pack.questions.map((q) => ({
      ...q,
      category: normalizeInterviewCategory(q.category),
      why: plainInterviewText(
        (q.why ?? "").trim() ||
          defaultWhy(
            normalizeInterviewCategory(q.category),
            pack.roleTitle || "this role",
          ),
      ),
      angle: plainInterviewText((q.angle ?? "").trim()),
      sampleAnswer: plainInterviewText((q.sampleAnswer ?? "").trim()),
      talkingPoints: Array.isArray(q.talkingPoints)
        ? q.talkingPoints
            .map((item) => plainInterviewText(item))
            .filter(Boolean)
            .slice(0, 3)
        : [],
      question: plainInterviewText(q.question),
    })),
    weakSections: pack.weakSections ?? [],
    qualificationGaps: pack.qualificationGaps ?? [],
    strengths: pack.strengths ?? [],
    bulletRewrites: (pack.bulletRewrites ?? [])
      .map((item) => ({
        ...item,
        role: plainInterviewText(item.role ?? ""),
        current: plainInterviewText(item.current ?? ""),
        suggested: plainInterviewText(item.suggested ?? ""),
        keyword: plainInterviewText(item.keyword ?? ""),
      }))
      .filter((item) => item.suggested)
      .slice(0, 4),
    readiness: {
      headline: plainInterviewText(pack.readiness?.headline ?? ""),
      summary: plainInterviewText(pack.readiness?.summary ?? ""),
      actions: (pack.readiness?.actions ?? [])
        .map(plainInterviewText)
        .filter(Boolean),
      readyToApply: Boolean(pack.readiness?.readyToApply),
    },
  };
  if (!resume) return normalized;
  const ctx = interviewContextFromResume(
    resume,
    normalized.roleTitle || "this role",
    normalized.missing.map(prettyKeyword),
    normalized.matched.map(prettyKeyword),
  );
  return {
    ...normalized,
    questions: completeInterviewSet(normalized.questions, ctx),
  };
}

function defaultWhy(category: InterviewCategory, roleTitle: string) {
  if (category === "technical") {
    return `They want to know you can do the daily work of a ${roleTitle}, not only list tools on your resume.`;
  }
  if (category === "situational") {
    return `They want to see how you would act on a real ${roleTitle} day. What do you do first? Who do you ask?`;
  }
  return `They want one real story about how you work with people and problems. That matters in a ${roleTitle} job.`;
}

export function resumeInsightFlags(resume: Resume) {
  const hasExperience =
    resume.experience.length > 0 || resume.noExperience.length > 0;
  return {
    emptySummary: !resume.personal.summary.trim(),
    thinExperience: !hasExperience,
    shortSkills: resume.skills.length < 4,
    noEducation: resume.education.length === 0,
  };
}

function isLanguageKeyword(keyword: string) {
  return /^(english|khmer|chinese|mandarin|french|korean|japanese|thai|vietnamese|spanish)$/i.test(
    keyword.trim(),
  );
}

export function languageGapsFromMissing(missing: string[]) {
  return missing.filter(isLanguageKeyword).map(prettyKeyword);
}

/** Local stand-in when the shared AI call is skipped or returns empty. */
export function buildFallbackAnalysis(
  jobText: string,
  resume: Resume,
  match?: JobMatchResult,
): JobAnalysisPack {
  const local = match ?? computeJobMatch(jobText, resume);
  const roleTitle = guessRoleTitle(jobText, resume);
  const topMissing = local.missing.slice(0, 3).map(prettyKeyword);
  const topMatched = local.matched.slice(0, 3).map(prettyKeyword);
  const ctx = interviewContextFromResume(
    resume,
    roleTitle,
    topMissing,
    topMatched,
  );

  const flags = resumeInsightFlags(resume);
  const weakSections: string[] = [];
  if (flags.emptySummary) {
    weakSections.push(
      "The summary is empty. Open with the job title and 2 skills from this posting.",
    );
  }
  if (flags.thinExperience) {
    weakSections.push(
      "No job or project yet. Add an internship, class project, or volunteer work this role can use.",
    );
  } else {
    weakSections.push(
      "Experience bullets need a number, tool, or result so they match this job ad.",
    );
  }
  if (flags.shortSkills) {
    weakSections.push(
      "The skills list is short versus the posting. Add tools you can honestly use.",
    );
  }

  const qualificationGaps: string[] = [];
  if (flags.noEducation) {
    qualificationGaps.push(
      "Education is not listed. Many Cambodian postings still scan for a degree or current studies.",
    );
  }
  const langGaps = languageGapsFromMissing(local.missing);
  if (langGaps.length) {
    qualificationGaps.push(
      `This posting asks for ${langGaps.join(" and ")}. Add it under languages if you speak it.`,
    );
  }

  const strengths = topMatched.length
    ? topMatched.map(
        (keyword) => `You already show ${keyword}, which this posting looks for.`,
      )
    : [
        "The resume has a clear structure. Align the summary and skills to this job next.",
      ];

  const questions = completeInterviewSet([], ctx);
  const readyToApply = local.score >= 70 && qualificationGaps.length === 0;
  const actions = [
    `Practice the ${questions.length} interview questions written for this ${roleTitle} role.`,
    ...(topMissing.length
      ? [
          `Add ${topMissing.slice(0, 2).join(" and ")} to your resume where you can honestly claim them.`,
        ]
      : [
          "Tighten your summary so the job's top keywords appear in the first lines.",
        ]),
    "Download a PDF and review it the way a recruiter would. One page, clear titles, and proof in every bullet.",
  ];

  return {
    roleTitle,
    matchScore: local.score,
    matched: local.matched.slice(0, 8),
    missing: local.missing.slice(0, 8),
    weakSections: weakSections.slice(0, 4),
    qualificationGaps: qualificationGaps.slice(0, 3),
    strengths: strengths.slice(0, 4),
    bulletRewrites: buildFallbackBulletRewrites(resume, local.missing).map(
      ({ id, role, current, suggested, keyword }) => ({
        id,
        role,
        current,
        suggested,
        keyword,
      }),
    ),
    questions,
    readiness: {
      headline: readyToApply
        ? "You're in good shape for this role"
        : local.score >= 40
          ? "You're close. A few gaps to close"
          : "There's work to do before you apply",
      summary: readyToApply
        ? "Your resume matches most of this posting. Practice the interview questions, then apply."
        : topMissing.length
          ? `Your resume matches part of this posting. Close the skill and qualification gaps below, then practice the questions before you apply.`
          : "Strengthen the weak sections below and practice the interview questions so you can walk in ready.",
      actions,
      readyToApply,
    },
    source: "fallback",
  };
}

export function interviewReadinessLabel(
  practiced: number,
  total: number,
): "notStarted" | "gettingStarted" | "good" | "ready" {
  if (total <= 0 || practiced <= 0) return "notStarted";
  if (practiced >= total) return "ready";
  if (practiced / total >= 0.5) return "good";
  return "gettingStarted";
}

export function overallReadinessScore(input: {
  resumeQuality: number;
  jobMatch: number;
  interviewPercent: number;
}) {
  return Math.round(
    input.jobMatch * 0.4 +
      input.resumeQuality * 0.3 +
      input.interviewPercent * 0.3,
  );
}

export function isReadyToApply(input: {
  overall: number;
  interviewPercent: number;
  qualificationGapCount: number;
}) {
  return (
    input.overall >= 70 &&
    input.interviewPercent >= 50 &&
    input.qualificationGapCount === 0
  );
}

/** One credit / one Gemini call / 20 Q&A. Falls back locally so later steps still work. */
export async function resolveJobAnalysisPack(
  jobText: string,
  resume: Resume,
  remainingCredits: number,
  setCredits: (total: number, used: number) => void,
): Promise<JobAnalysisPack> {
  const local = computeJobMatch(jobText, resume);
  if (remainingCredits <= 0) {
    return buildFallbackAnalysis(jobText, resume, local);
  }

  try {
    const { pack, credits } = await requestJobAnalysis(
      jobText,
      resumePlainText(resume),
    );
    setCredits(credits.total, credits.used);
    if (pack.source === "gemini" && pack.questions.length >= 8) {
      const split = computeJobMatch(
        jobText,
        resume,
        requirementKeywords(jobText, pack),
      );
      return withNormalizedQuestions(
        {
          ...pack,
          roleTitle: pack.roleTitle || guessRoleTitle(jobText, resume),
          matched: split.matched,
          missing: split.missing,
        },
        resume,
      );
    }
  } catch (err) {
    if (err instanceof BackendError) {
      const credits: CreditBalance | null = creditsFromErrorBody(err.body);
      if (credits) setCredits(credits.total, credits.used);
    }
  }

  return buildFallbackAnalysis(jobText, resume, local);
}
