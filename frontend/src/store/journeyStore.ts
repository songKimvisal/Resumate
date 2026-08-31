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
  /** Resume this analysis belongs to. Required to review after switching resumes. */
  resumeId?: string;
};

export type JourneyDraft = {
  step: JourneyStep;
  jobText?: string;
  hasResults?: boolean;
  /** One AI (or local fallback) pack reused by Interview Prep and Readiness. */
  analysis?: JobAnalysisPack;
  practicedQuestionIds?: string[];
  /** Other job ads kept on this resume. Active job stays in jobText/analysis. Max 4. */
  savedJobs?: SavedJobRun[];
  /** ISO time of last local or server write. Used to merge cloud vs this device. */
  updatedAt?: string;
};

const EMPTY: JourneyDraft = { step: 0 };
const EMPTY_IDS: string[] = [];
const EMPTY_JOBS: SavedJobRun[] = [];
export const MAX_SAVED_JOBS = 4;

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

export type ReviewableJob = SavedJobRun & { resumeId: string };

/** Active analysis first, then other stored jobs on this resume. */
export function reviewableJobsOf(
  draft?: JourneyDraft,
  resumeId?: string,
) {
  const saved = savedJobsOf(draft);
  const snap = draft ? snapshotActive(draft, resumeId) : null;
  if (!snap) return saved;
  return [snap, ...saved.filter((job) => job.id !== snap.id)];
}

/** Saved and in-progress jobs across every resume for this user. */
export function reviewableJobsForUser(
  byKey: Record<string, JourneyDraft>,
  userId: string,
): ReviewableJob[] {
  const prefix = `${userId}:`;
  const jobs: ReviewableJob[] = [];
  const seen = new Set<string>();
  for (const [key, draft] of Object.entries(byKey)) {
    if (!key.startsWith(prefix)) continue;
    const resumeId = key.slice(prefix.length);
    if (!resumeId) continue;
    for (const job of reviewableJobsOf(draft, resumeId)) {
      const id = `${resumeId}:${job.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      jobs.push({ ...job, resumeId });
    }
  }
  return jobs;
}

export function activeJobId(draft?: JourneyDraft) {
  const text = draft?.jobText?.trim();
  return text && draft?.analysis ? jobKey(text) : null;
}

/** Best interview set on a resume: active analysis, else the latest saved job. */
export function interviewPrepForDraft(draft?: JourneyDraft): {
  practiced: number;
  total: number;
  jobId: string | null;
} | null {
  if (!draft) return null;

  const fromPack = (
    questions: InterviewQuestion[] | undefined,
    practicedIds: string[] | undefined,
    jobId: string | null,
  ) => {
    const total = questions?.length ?? 0;
    if (total === 0) return null;
    const ready = new Set(practicedIds ?? []);
    const practiced = questions!.filter((q) => ready.has(q.id)).length;
    return { practiced, total, jobId };
  };

  const active = fromPack(
    draft.analysis?.questions,
    draft.practicedQuestionIds,
    activeJobId(draft),
  );
  if (active) return active;

  for (const job of draft.savedJobs ?? []) {
    const found = fromPack(
      job.analysis?.questions,
      job.practicedQuestionIds,
      job.id,
    );
    if (found) return found;
  }
  return null;
}

/** How many resumes have an interview set ready, for the sidebar count. */
export function interviewPrepCountForUser(
  byKey: Record<string, JourneyDraft>,
  userId: string,
) {
  const prefix = `${userId}:`;
  let count = 0;
  for (const [key, draft] of Object.entries(byKey)) {
    if (!key.startsWith(prefix)) continue;
    if (interviewPrepForDraft(draft)) count += 1;
  }
  return count;
}

function stamp(draft: JourneyDraft): JourneyDraft {
  return { ...draft, updatedAt: new Date().toISOString() };
}

export function isMeaningfulDraft(draft?: JourneyDraft) {
  if (!draft) return false;
  return (
    (draft.step ?? 0) > 0 ||
    Boolean(draft.jobText?.trim()) ||
    Boolean(draft.analysis) ||
    Boolean(draft.hasResults) ||
    (draft.savedJobs?.length ?? 0) > 0
  );
}

export function parseStorageKey(key: string, userId: string) {
  const prefix = `${userId}:`;
  if (!key.startsWith(prefix)) return null;
  return key.slice(prefix.length);
}

function snapshotActive(
  draft: JourneyDraft,
  resumeId?: string,
): SavedJobRun | null {
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
    resumeId,
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
  /** True after this session tried to load journeys from Supabase. */
  remoteHydrated: boolean;
  getDraft: (userId?: string | null, resumeId?: string | null) => JourneyDraft;
  rememberResume: (userId: string, resumeId: string) => void;
  forgetResume: (userId: string, resumeId: string) => void;
  hydrateFromCloud: (
    userId: string,
    rows: { resumeId: string; data: JourneyDraft; updatedAt: string }[],
  ) => void;
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
  keepCurrentJob: (userId: string, resumeId: string) => void;
  activateSavedJob: (userId: string, resumeId: string, jobId: string) => void;
  removeJob: (userId: string, resumeId: string, jobId: string) => void;
  clearResumeJobs: (userId: string, resumeId: string) => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      byKey: {},
      lastUserId: null,
      lastResumeId: null,
      remoteHydrated: false,

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

      hydrateFromCloud: (userId, rows) =>
        set((s) => {
          const byKey = { ...s.byKey };
          for (const row of rows) {
            const k = storageKey(userId, row.resumeId);
            const local = byKey[k];
            const serverDraft: JourneyDraft = {
              ...row.data,
              updatedAt: row.data?.updatedAt ?? row.updatedAt,
            };
            if (!isMeaningfulDraft(serverDraft) && !local) continue;
            if (!local) {
              byKey[k] = serverDraft;
              continue;
            }
            const localTime = Date.parse(local.updatedAt ?? "") || 0;
            const serverTime = Date.parse(serverDraft.updatedAt ?? "") || 0;
            if (serverTime >= localTime) byKey[k] = serverDraft;
          }
          return { byKey };
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
              [k]: prev.step === nextStep ? prev : stamp({ ...prev, step: nextStep }),
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
              [k]: stamp({ ...prev, ...patch }),
            },
          };
        }),

      startNewJob: (userId, resumeId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const snap = snapshotActive(prev, resumeId);
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: stamp({
                ...prev,
                savedJobs: snap
                  ? pushSaved(prev.savedJobs ?? [], snap)
                  : prev.savedJobs ?? [],
                jobText: "",
                hasResults: false,
                analysis: undefined,
                practicedQuestionIds: [],
                step: 0,
              }),
            },
          };
        }),

      keepCurrentJob: (userId, resumeId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const snap = snapshotActive(prev, resumeId);
          if (!snap) return s;
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
                [k]: stamp({
                ...prev,
                savedJobs: pushSaved(prev.savedJobs ?? [], snap),
              }),
            },
          };
        }),

      activateSavedJob: (userId, resumeId, jobId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const snap = snapshotActive(prev, resumeId);
          if (snap?.id === jobId || activeJobId(prev) === jobId) {
            return { lastUserId: userId, lastResumeId: resumeId };
          }
          const target = (prev.savedJobs ?? []).find((job) => job.id === jobId);
          if (!target) return s;
          const rest = (prev.savedJobs ?? []).filter((job) => job.id !== jobId);
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: stamp({
                ...prev,
                savedJobs: snap ? pushSaved(rest, snap) : rest,
                jobText: target.jobText,
                hasResults: target.hasResults,
                analysis: target.analysis,
                practicedQuestionIds: target.practicedQuestionIds ?? [],
              }),
            },
          };
        }),

      removeJob: (userId, resumeId, jobId) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k];
          if (!prev) return s;
          const activeId = activeJobId(prev);
          const savedJobs = (prev.savedJobs ?? []).filter(
            (job) => job.id !== jobId,
          );
          const clearingActive = activeId === jobId;
          if (!clearingActive && savedJobs.length === (prev.savedJobs ?? []).length) {
            return s;
          }
          const next: JourneyDraft = {
            ...prev,
            savedJobs,
            ...(clearingActive
              ? {
                  jobText: "",
                  hasResults: false,
                  analysis: undefined,
                  practicedQuestionIds: [],
                }
              : {}),
          };
          const leftover = reviewableJobsOf(next, resumeId);
          if (leftover.length === 0) {
            const byKey = { ...s.byKey };
            delete byKey[k];
            return {
              byKey,
              lastResumeId:
                s.lastUserId === userId && s.lastResumeId === resumeId
                  ? null
                  : s.lastResumeId,
            };
          }
          return {
            byKey: {
              ...s.byKey,
              [k]: stamp({ ...next, step: leftover.length ? next.step : 0 }),
            },
          };
        }),

      clearResumeJobs: (userId, resumeId) =>
        get().forgetResume(userId, resumeId),
    }),
    {
      name: "resumate-journey",
      version: 3,
      migrate: (persisted) => persisted,
      partialize: (s) => ({
        byKey: s.byKey,
        lastUserId: s.lastUserId,
        lastResumeId: s.lastResumeId,
      }),
    },
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
    pathname === "/job-match" ||
    pathname === "/job-readiness"
  );
}

export function useJourneyHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useJourneyStore.persist.hasHydrated(),
  );
  const remoteHydrated = useJourneyStore((s) => s.remoteHydrated);

  useEffect(() => {
    if (useJourneyStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useJourneyStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated && remoteHydrated;
}
