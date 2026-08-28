import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const JOURNEY_ROUTES = [
  "/dashboard",
  "/job-match",
  "/job-match/interview-prep",
  "/job-readiness",
] as const;

export type JourneyStep = 0 | 1 | 2 | 3;

export type InterviewCategory = "behavioral" | "technical" | "situational";

export type InterviewQuestion = {
  id: string;
  category: InterviewCategory;
  question: string;
  /** Why an interviewer for THIS job would ask this. */
  why?: string;
  /** How to structure the answer using this resume (STAR for behavioral). */
  angle: string;
  /** First-person spoken sample grounded in resume facts. */
  sampleAnswer?: string;
  talkingPoints?: string[];
};

export type AnalysisBulletRewrite = {
  id?: string;
  role: string;
  current: string;
  suggested: string;
  keyword: string;
};

export type JobAnalysisPack = {
  roleTitle: string;
  matchScore: number;
  matched: string[];
  missing: string[];
  weakSections: string[];
  qualificationGaps: string[];
  strengths: string[];
  bulletRewrites?: AnalysisBulletRewrite[];
  questions: InterviewQuestion[];
  readiness: {
    headline: string;
    summary: string;
    actions: string[];
    readyToApply: boolean;
  };
  source: "gemini" | "fallback";
};

export type SavedJobRun = {
  id: string;
  jobText: string;
  roleTitle: string;
  matchScore: number;
  hasResults: boolean;
  analysis?: JobAnalysisPack;
  practicedQuestionIds?: string[];
};

export type JourneyDraft = {
  step: JourneyStep;
  jobText?: string;
  hasResults?: boolean;
  /** One AI (or local fallback) pack reused by Interview Prep and Readiness. */
  analysis?: JobAnalysisPack;
  practicedQuestionIds?: string[];
  /** Other job ads on this resume. Active job stays in jobText/analysis. Max 2. */
  savedJobs?: SavedJobRun[];
};

const EMPTY: JourneyDraft = { step: 0 };
const EMPTY_IDS: string[] = [];
const EMPTY_JOBS: SavedJobRun[] = [];
const MAX_SAVED_JOBS = 2;

function storageKey(userId: string, resumeId: string) {
  return `${userId}:${resumeId}`;
}

export function jobKey(jobText: string) {
  const s = jobText.trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `job-${Math.abs(h).toString(36)}`;
}

export function savedJobsOf(draft?: JourneyDraft) {
  return draft?.savedJobs ?? EMPTY_JOBS;
}

function snapshotActive(draft: JourneyDraft): SavedJobRun | null {
  const jobText = draft.jobText?.trim();
  if (!jobText || !draft.analysis) return null;
  return {
    id: jobKey(jobText),
    jobText,
    roleTitle: draft.analysis.roleTitle || "",
    matchScore: draft.analysis.matchScore,
    hasResults: Boolean(draft.hasResults),
    analysis: draft.analysis,
    practicedQuestionIds: draft.practicedQuestionIds ?? [],
  };
}

function pushSaved(list: SavedJobRun[], item: SavedJobRun) {
  return [item, ...list.filter((job) => job.id !== item.id)].slice(
    0,
    MAX_SAVED_JOBS,
  );
}

/** Stable store slice for a user+resume draft. Safe to use as a selector. */
export function useJourneyDraft(
  userId?: string | null,
  resumeId?: string | null,
) {
  return useJourneyStore((s) => {
    if (!userId || !resumeId) return undefined;
    return s.byKey[storageKey(userId, resumeId)];
  });
}

export function practicedIdsOf(draft?: JourneyDraft) {
  return draft?.practicedQuestionIds ?? EMPTY_IDS;
}

interface JourneyState {
  byKey: Record<string, JourneyDraft>;
  lastUserId: string | null;
  lastResumeId: string | null;
  getDraft: (userId?: string | null, resumeId?: string | null) => JourneyDraft;
  rememberResume: (userId: string, resumeId: string) => void;
  forgetResume: (userId: string, resumeId: string) => void;
  reachStep: (
    userId: string,
    resumeId: string,
    step: JourneyStep,
  ) => void;
  saveDraft: (
    userId: string,
    resumeId: string,
    patch: Partial<Omit<JourneyDraft, "step">>,
  ) => void;
  startNewJob: (userId: string, resumeId: string) => void;
  activateSavedJob: (userId: string, resumeId: string, jobId: string) => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      byKey: {},
      lastUserId: null,
      lastResumeId: null,

      getDraft: (userId, resumeId) => {
        if (!userId || !resumeId) return EMPTY;
        return get().byKey[storageKey(userId, resumeId)] ?? EMPTY;
      },

      rememberResume: (userId, resumeId) =>
        set((s) =>
          s.lastUserId === userId && s.lastResumeId === resumeId
            ? s
            : { lastUserId: userId, lastResumeId: resumeId },
        ),

      forgetResume: (userId, resumeId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          if (!(k in s.byKey) && s.lastResumeId !== resumeId) return s;
          const byKey = { ...s.byKey };
          delete byKey[k];
          return {
            byKey,
            lastResumeId:
              s.lastUserId === userId && s.lastResumeId === resumeId
                ? null
                : s.lastResumeId,
          };
        }),

      reachStep: (userId, resumeId, step) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const nextStep = step > prev.step ? step : prev.step;
          if (
            s.lastUserId === userId &&
            s.lastResumeId === resumeId &&
            s.byKey[k] &&
            prev.step === nextStep
          ) {
            return s;
          }
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: prev.step === nextStep ? prev : { ...prev, step: nextStep },
            },
          };
        }),

      saveDraft: (userId, resumeId, patch) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: { ...prev, ...patch },
            },
          };
        }),

      startNewJob: (userId, resumeId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const snap = snapshotActive(prev);
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: {
                ...prev,
                savedJobs: snap
                  ? pushSaved(prev.savedJobs ?? [], snap)
                  : prev.savedJobs ?? [],
                jobText: "",
                hasResults: false,
                analysis: undefined,
                practicedQuestionIds: [],
              },
            },
          };
        }),

      activateSavedJob: (userId, resumeId, jobId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const target = (prev.savedJobs ?? []).find((job) => job.id === jobId);
          if (!target) return s;
          const snap = snapshotActive(prev);
          const rest = (prev.savedJobs ?? []).filter((job) => job.id !== jobId);
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: {
                ...prev,
                savedJobs: snap ? pushSaved(rest, snap) : rest,
                jobText: target.jobText,
                hasResults: target.hasResults,
                analysis: target.analysis,
                practicedQuestionIds: target.practicedQuestionIds ?? [],
              },
            },
          };
        }),
    }),
    { name: "resumate-journey", version: 2, migrate: (persisted) => persisted },
  ),
);

/** Continue from dashboard into the furthest saved process step. */
export function journeyContinuePath(step: JourneyStep) {
  return JOURNEY_ROUTES[Math.max(step, 1)];
}

function resumeIdForUser(
  state: Pick<JourneyState, "byKey" | "lastUserId" | "lastResumeId">,
  userId: string,
) {
  if (state.lastUserId === userId && state.lastResumeId) {
    return state.lastResumeId;
  }

  const prefix = `${userId}:`;
  let bestId: string | null = null;
  let bestStep = -1;
  for (const [key, draft] of Object.entries(state.byKey)) {
    if (!key.startsWith(prefix)) continue;
    if (draft.step >= bestStep) {
      bestStep = draft.step;
      bestId = key.slice(prefix.length);
    }
  }
  return bestId;
}

export function continuePathForUser(
  state: Pick<JourneyState, "byKey" | "lastUserId" | "lastResumeId">,
  userId?: string | null,
) {
  if (!userId) return "/dashboard";
  const resumeId = resumeIdForUser(state, userId);
  if (!resumeId) return "/dashboard";
  const step = state.byKey[storageKey(userId, resumeId)]?.step ?? 0;
  if (step <= 0) return "/dashboard";
  return journeyContinuePath(step);
}

export function isJourneyNavPath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname === "/select-resume" ||
    pathname.startsWith("/job-match") ||
    pathname === "/job-readiness"
  );
}

export function useJourneyHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useJourneyStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useJourneyStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useJourneyStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
