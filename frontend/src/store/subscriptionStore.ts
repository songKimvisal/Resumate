import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackId, PlanId } from "../types/billing";
import { isPackId } from "../types/billing";
import { creditsForPack, creditsForPlan } from "../lib/aiCredits";

interface SubscriptionState {
  plan: PlanId;
  lastPackId: PackId | null;
  isSubscribed: boolean;
  aiCreditsTotal: number;
  aiCreditsUsed: number;
  subscribeToPlan: (plan: PlanId, packId?: PackId) => void;
  setCredits: (total: number, used: number) => void;
  unsubscribe: () => void;
}

const DEFAULT_STATE: Pick<
  SubscriptionState,
  | "plan"
  | "lastPackId"
  | "isSubscribed"
  | "aiCreditsTotal"
  | "aiCreditsUsed"
> = {
  plan: "free",
  lastPackId: null,
  isSubscribed: false,
  aiCreditsTotal: 0,
  aiCreditsUsed: 0,
};

function creditsFromPersisted(state: Partial<SubscriptionState>): number {
  if (typeof state.aiCreditsTotal === "number") return state.aiCreditsTotal;
  if (state.lastPackId && isPackId(state.lastPackId)) {
    return creditsForPack(state.lastPackId);
  }
  if (typeof state.plan === "string") return creditsForPlan(state.plan);
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
      unsubscribe: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "resumate-subscription",
      version: 4,
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
        };
      },
    },
  ),
);
