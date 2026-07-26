import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanId } from "../types/billing";

interface SubscriptionState {
  plan: PlanId;
  isSubscribed: boolean;
  subscribeToPlan: (plan: PlanId) => void;
  unsubscribe: () => void;
}

const DEFAULT_STATE: Pick<SubscriptionState, "plan" | "isSubscribed"> = {
  plan: "free",
  isSubscribed: false,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      subscribeToPlan: (plan) => set({ plan, isSubscribed: plan !== "free" }),
      unsubscribe: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "resumate-subscription",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<SubscriptionState> | undefined;
        if (!state || typeof state.plan !== "string") {
          return { ...DEFAULT_STATE };
        }
        return state;
      },
    },
  ),
);
