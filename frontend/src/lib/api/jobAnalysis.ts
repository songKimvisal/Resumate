import { callBackend } from "./client";
import type { AnalysisBalance } from "./analyses";
import type { InterviewCategory, JobAnalysisPack } from "../../store/journeyStore";

function normalizeCategory(value: string): InterviewCategory {
  const raw = value.toLowerCase().replace("_", "-");
  if (raw === "technical") return "technical";
  if (raw === "situational" || raw.includes("role")) return "situational";
  return "behavioral";
}

interface JobAnalysisApiResponse {
  role_title?: string;
  roleTitle?: string;
  match_score?: number;
  matchScore?: number;
  matched: string[];
  missing: string[];
  weak_sections?: string[];
  weakSections?: string[];
  qualification_gaps?: string[];
  qualificationGaps?: string[];
  strengths?: string[];
  bullet_rewrites?: {
    role?: string;
    current?: string;
    suggested?: string;
    keyword?: string;
  }[];
  bulletRewrites?: {
    role?: string;
    current?: string;
    suggested?: string;
    keyword?: string;
  }[];
  questions: {
    id: string;
    category: string;
    question: string;
    angle: string;
    why?: string;
    sample_answer?: string;
    sampleAnswer?: string;
    talking_points?: string[];
    talkingPoints?: string[];
  }[];
  readiness: {
    headline: string;
    summary: string;
    actions: string[];
    ready_to_apply?: boolean;
    readyToApply?: boolean;
  };
  source: "gemini" | "fallback";
  analyses: AnalysisBalance;
}

function stringList(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, max);
}

export async function requestJobAnalysis(
  jobText: string,
  resumeText: string,
): Promise<{ pack: JobAnalysisPack; analyses: AnalysisBalance }> {
  const data = await callBackend<JobAnalysisApiResponse>("/api/job-analysis", {
    job_text: jobText,
    resume_text: resumeText,
  });

  const questions = (data.questions ?? [])
    .map((item, i) => {
      const category: InterviewCategory = normalizeCategory(
        item.category || "behavioral",
      );
      return {
        id: item.id || `q${i + 1}`,
        category,
        question: item.question.trim(),
        angle: (item.angle || "").trim(),
        why: (item.why || "").trim(),
        sampleAnswer: (item.sample_answer || item.sampleAnswer || "").trim(),
        talkingPoints: stringList(
          item.talking_points ?? item.talkingPoints,
          3,
        ),
      };
    })
    .filter((item) => item.question);

  return {
    analyses: data.analyses ?? { total: 0, used: 0, remaining: 0 },
    pack: {
      roleTitle: (data.role_title || data.roleTitle || "").trim(),
      matchScore: Math.max(0, Math.min(100, data.match_score || data.matchScore || 0)),
      matched: stringList(data.matched, 8),
      missing: stringList(data.missing, 8),
      weakSections: stringList(data.weak_sections ?? data.weakSections, 4),
      qualificationGaps: stringList(
        data.qualification_gaps ?? data.qualificationGaps,
        3,
      ),
      strengths: stringList(data.strengths, 4),
      bulletRewrites: (
        data.bullet_rewrites ??
        data.bulletRewrites ??
        []
      )
        .map((item, i) => ({
          id: `ai-${i}`,
          role: String(item.role || "").trim(),
          current: String(item.current || "").trim(),
          suggested: String(item.suggested || "").trim(),
          keyword: String(item.keyword || "").trim(),
        }))
        .filter((item) => item.suggested)
        .slice(0, 4),
      questions: questions.slice(0, 20),
      readiness: {
        headline: (data.readiness?.headline || "").trim(),
        summary: (data.readiness?.summary || "").trim(),
        actions: stringList(data.readiness?.actions, 4),
        readyToApply: Boolean(
          data.readiness?.ready_to_apply ?? data.readiness?.readyToApply,
        ),
      },
      source: data.source,
    },
  };
}


