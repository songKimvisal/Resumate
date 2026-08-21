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

export type JourneyDraft = {
  step: JourneyStep;
  jobText?: string;
  hasResults?: boolean;
};

const EMPTY: JourneyDraft = { step: 0 };

function storageKey(userId: string, resumeId: string) {
  return `${userId}:${resumeId}`;
}

interface JourneyState {
  byKey: Record<string, JourneyDraft>;
  lastUserId: string | null;
  lastResumeId: string | null;
  getDraft: (userId?: string | null, resumeId?: string | null) => JourneyDraft;
  rememberResume: (userId: string, resumeId: string) => void;
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

      reachStep: (userId, resumeId, step) =>
        set((s) => {
          const k = storageKey(userId, resumeId);
          const prev = s.byKey[k] ?? EMPTY;
          const nextStep = step > prev.step ? step : prev.step;
          return {
            lastUserId: userId,
            lastResumeId: resumeId,
            byKey: {
              ...s.byKey,
              [k]: { ...prev, step: nextStep },
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
    }),
    { name: "resumate-journey" },
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
