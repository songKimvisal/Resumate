import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackId, PlanId } from "../types/billing";
import { isPackId } from "../types/billing";
import { creditsForPack, creditsForPlan } from "../lib/aiCredits";
import { FREE_PDF_SAVES, pdfsForPack } from "../lib/pdfSaves";

interface SubscriptionState {
  plan: PlanId;
  lastPackId: PackId | null;
  isSubscribed: boolean;
  aiCreditsTotal: number;
  aiCreditsUsed: number;
  pdfsTotal: number;
  pdfsUsed: number;
  subscribeToPlan: (plan: PlanId, packId?: PackId) => void;
  setCredits: (total: number, used: number) => void;
  grantPdfs: (n: number) => void;
  canSavePdf: () => boolean;
  consumePdfSave: () => boolean;
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
> = {
  plan: "free",
  lastPackId: null,
  isSubscribed: false,
  aiCreditsTotal: 0,
  aiCreditsUsed: 0,
  pdfsTotal: FREE_PDF_SAVES,
  pdfsUsed: 0,
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

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
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
      grantPdfs: (n) => {
        const add = Math.max(0, n);
        if (add === 0) return;
        set((s) => ({ pdfsTotal: s.pdfsTotal + add }));
      },
      canSavePdf: () => {
        const s = get();
        return s.pdfsUsed < s.pdfsTotal;
      },
      consumePdfSave: () => {
        const s = get();
        if (s.pdfsUsed >= s.pdfsTotal) return false;
        set({ pdfsUsed: s.pdfsUsed + 1 });
        return true;
      },
      unsubscribe: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "resumate-subscription",
      version: 6,
      partialize: (s) => ({
        plan: s.plan,
        lastPackId: s.lastPackId,
        isSubscribed: s.isSubscribed,
        aiCreditsTotal: s.aiCreditsTotal,
        aiCreditsUsed: s.aiCreditsUsed,
        pdfsTotal: s.pdfsTotal,
        pdfsUsed: s.pdfsUsed,
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
        };
      },
    },
  ),
);
