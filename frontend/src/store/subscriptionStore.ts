import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackId, PlanId } from "../types/billing";
import { isPackId } from "../types/billing";
import { creditsForPack, creditsForPlan } from "../lib/aiCredits";
import { FREE_PDF_SAVES, pdfsForPack } from "../lib/pdfSaves";
import { analysesForPack } from "../lib/jobAnalyses";

interface SubscriptionState {
  plan: PlanId;
  lastPackId: PackId | null;
  isSubscribed: boolean;
  aiCreditsTotal: number;
  aiCreditsUsed: number;
  pdfsTotal: number;
  pdfsUsed: number;
  analysesTotal: number;
  analysesUsed: number;
  subscribeToPlan: (plan: PlanId, packId?: PackId) => void;
  setCredits: (total: number, used: number) => void;
  setPdfs: (total: number, used: number) => void;
  setAnalyses: (total: number, used: number) => void;
  unsubscribe: () => void;
}

const DEFAULT_STATE: Pick<
  SubscriptionState,
  | "plan"
  | "lastPackId"
  | "isSubscribed"
  | "aiCreditsTotal"
  | "aiCreditsUsed"
  | "pdfsTotal"
  | "pdfsUsed"
  | "analysesTotal"
  | "analysesUsed"
> = {
  plan: "free",
  lastPackId: null,
  isSubscribed: false,
  aiCreditsTotal: 0,
  aiCreditsUsed: 0,
  pdfsTotal: FREE_PDF_SAVES,
  pdfsUsed: 0,
  analysesTotal: 0,
  analysesUsed: 0,
};

function creditsFromPersisted(state: Partial<SubscriptionState>): number {
  if (typeof state.aiCreditsTotal === "number") return state.aiCreditsTotal;
  if (state.lastPackId && isPackId(state.lastPackId)) {
    return creditsForPack(state.lastPackId);
  }
  if (typeof state.plan === "string") return creditsForPlan(state.plan);
  return 0;
}

function pdfsFromPersisted(state: Partial<SubscriptionState>): number {
  if (typeof state.pdfsTotal === "number") return state.pdfsTotal;
  const fromPack =
    state.lastPackId && isPackId(state.lastPackId)
      ? pdfsForPack(state.lastPackId)
      : 0;
  return FREE_PDF_SAVES + fromPack;
}

function analysesFromPersisted(state: Partial<SubscriptionState>): number {
  if (typeof state.analysesTotal === "number") return state.analysesTotal;
  if (state.lastPackId && isPackId(state.lastPackId)) {
    return analysesForPack(state.lastPackId);
  }
  return 0;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      subscribeToPlan: (plan, packId) =>
        set((s) => ({
          plan,
          lastPackId: packId ?? s.lastPackId,
          isSubscribed: plan !== "free",
        })),
      setCredits: (total, used) =>
        set({
          aiCreditsTotal: Math.max(0, total),
          aiCreditsUsed: Math.max(0, used),
        }),
      setPdfs: (total, used) =>
        set({
          pdfsTotal: Math.max(0, total),
          pdfsUsed: Math.max(0, used),
        }),
      setAnalyses: (total, used) =>
        set({
          analysesTotal: Math.max(0, total),
          analysesUsed: Math.max(0, used),
        }),
      unsubscribe: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "resumate-subscription",
      version: 8,
      partialize: (s) => ({
        plan: s.plan,
        lastPackId: s.lastPackId,
        isSubscribed: s.isSubscribed,
        aiCreditsTotal: s.aiCreditsTotal,
        aiCreditsUsed: s.aiCreditsUsed,
        pdfsTotal: s.pdfsTotal,
        pdfsUsed: s.pdfsUsed,
        analysesTotal: s.analysesTotal,
        analysesUsed: s.analysesUsed,
      }),
      migrate: (persisted) => {
        const state = persisted as Partial<SubscriptionState> | undefined;
        if (!state || typeof state.plan !== "string") {
          return { ...DEFAULT_STATE };
        }
        return {
          ...DEFAULT_STATE,
          ...state,
          lastPackId: state.lastPackId ?? null,
          aiCreditsTotal: creditsFromPersisted(state),
          aiCreditsUsed:
            typeof state.aiCreditsUsed === "number" ? state.aiCreditsUsed : 0,
          pdfsTotal: pdfsFromPersisted(state),
          pdfsUsed: typeof state.pdfsUsed === "number" ? state.pdfsUsed : 0,
          analysesTotal: analysesFromPersisted(state),
          analysesUsed:
            typeof state.analysesUsed === "number" ? state.analysesUsed : 0,
        };
      },
    },
  ),
);
