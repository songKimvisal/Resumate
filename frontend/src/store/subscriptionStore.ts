import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackId, PlanId } from "../types/billing";

interface SubscriptionState {
  plan: PlanId;
  lastPackId: PackId | null;
  isSubscribed: boolean;
  subscribeToPlan: (plan: PlanId, packId?: PackId) => void;
  unsubscribe: () => void;
}

const DEFAULT_STATE: Pick<
  SubscriptionState,
  "plan" | "lastPackId" | "isSubscribed"
> = {
  plan: "free",
  lastPackId: null,
  isSubscribed: false,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      subscribeToPlan: (plan, packId) =>
        set({
          plan,
          lastPackId: packId ?? null,
          isSubscribed: plan !== "free",
        }),
      unsubscribe: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "resumate-subscription",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<SubscriptionState> | undefined;
        if (!state || typeof state.plan !== "string") {
          return { ...DEFAULT_STATE };
        }
        return {
          ...DEFAULT_STATE,
          ...state,
          lastPackId: state.lastPackId ?? null,
        };
      },
    },
  ),
);
