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
  polishInterviewQuestions,
  prettyProperName,
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

const JOB_SECTION_HEADING =
  /^(requirements?|responsibilities|qualifications?|about( the)? role|job description|description|duties|skills needed|benefits|overview|summary)\s*:?\s*$/i;

function looksLikeJobHeading(value: string) {
  const text = value.trim();
  if (text.length < 3) return true;
  if (JOB_SECTION_HEADING.test(text)) return true;
  if (/https?:\/\//i.test(text)) return true;
  return (
    /^(requirements?|responsibilities|qualifications?)\b/i.test(text) &&
    text.split(/\s+/).length <= 4
  );
}

function firstUsefulJobLine(jobText: string) {
  const labeled = jobText.match(
    /(?:job title|position|role)\s*[:\-]\s*([^\n]{4,70})/i,
  );
  if (labeled?.[1] && !looksLikeJobHeading(labeled[1])) {
    return labeled[1].trim().replace(/[.:]+$/, "");
  }
  return (
    jobText
      .split(/\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length >= 4 &&
          line.length <= 70 &&
          line.split(/\s+/).length <= 12 &&
          !looksLikeJobHeading(line),
      ) || ""
  );
}

export function guessRoleTitle(jobText: string, resume: Resume) {
  const fromField = splitJobAd(jobText).title;
  if (fromField) return fromField;
  const fromResume = resume.personal.jobTitle.trim();
  return firstUsefulJobLine(jobText) || fromResume || "this role";
}

/** Title for lists when Gemini returns a section heading like "Requirements :". */
export function displayJobTitle(roleTitle: string | undefined, jobText: string) {
  const fromField = splitJobAd(jobText).title;
  if (fromField) return fromField;
  const title = (roleTitle || "").trim().replace(/[.:]+$/, "");
  if (title && !looksLikeJobHeading(title) && title.toLowerCase() !== "this role") {
    return title;
  }
  return firstUsefulJobLine(jobText);
}

export function displayJobCompany(jobText: string) {
  return splitJobAd(jobText).company;
}

const COMPANY_LINE = /^Company:\s*(.*)$/i;
const TITLE_LINE = /^Job title:\s*(.*)$/i;

/** Optional company and title fields plus the pasted ad, for analysis. */
export function composeJobAd(company: string, title: string, body: string) {
  const parts: string[] = [];
  const companyName = company.trim();
  const roleTitle = title.trim();
  if (companyName) parts.push(`Company: ${companyName}`);
  if (roleTitle) parts.push(`Job title: ${roleTitle}`);
  const rest = body.trim();
  if (rest) parts.push(rest);
  return parts.join("\n");
}

/** Pull Company / Job title lines we prepended, so the paste box stays just the ad. */
export function splitJobAd(text: string) {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  let index = 0;
  let company = "";
  let title = "";
  const companyHit = lines[index]?.match(COMPANY_LINE);
  if (companyHit) {
    company = companyHit[1].trim();
    index += 1;
  }
  const titleHit = lines[index]?.match(TITLE_LINE);
  if (titleHit) {
    title = titleHit[1].trim();
    index += 1;
  }
  return {
    company,
    title,
    body: lines.slice(index).join("\n").trim(),
  };
}

export function jobAdSnippet(jobText: string, max = 110) {
  const clean = jobText.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}...`;
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
  jobText?: string,
): JobAnalysisPack {
  const parts = splitJobAd(jobText || "");
  const roleTitle = parts.title || pack.roleTitle || "this role";
  const normalized: JobAnalysisPack = {
    ...pack,
    roleTitle,
    questions: pack.questions.map((q) => ({
      ...q,
      category: normalizeInterviewCategory(q.category),
      why: plainInterviewText(
        (q.why ?? "").trim() ||
          defaultWhy(
            normalizeInterviewCategory(q.category),
            roleTitle,
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
    parts.company,
  );
  return {
    ...normalized,
    questions: polishInterviewQuestions(
      completeInterviewSet(normalized.questions, ctx),
      resume,
      parts.company || ctx.company,
    ),
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
    splitJobAd(jobText).company,
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

  const questions = polishInterviewQuestions(
    completeInterviewSet([], ctx),
    resume,
    ctx.company,
  );
  const readyToApply = local.score >= 70 && qualificationGaps.length === 0;
  const company = prettyProperName(splitJobAd(jobText).company);
  const jobBit = company
    ? `this ${roleTitle} role at ${company}`
    : `this ${roleTitle} role`;
  const actions = [
    `Practice the ${questions.length} interview questions written for ${jobBit}.`,
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
        ? `You're in good shape for ${jobBit}`
        : local.score >= 40
          ? `You're close. A few gaps to close for ${jobBit}`
          : `There's work to do before you apply for ${jobBit}`,
      summary: readyToApply
        ? `Your resume matches most of ${jobBit}. Practice the interview questions, then apply.`
        : topMissing.length
          ? `Your resume matches part of ${jobBit}. Close the skill and qualification gaps below, then practice the questions before you apply.`
          : `Strengthen the weak sections below and practice the interview questions so you can walk in ready for ${jobBit}.`,
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
        jobText,
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
