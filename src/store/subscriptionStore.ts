import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscriptionState {
  isSubscribed: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isSubscribed: false,
      subscribe: () => set({ isSubscribed: true }),
      unsubscribe: () => set({ isSubscribed: false }),
    }),
    { name: "resumate-subscription" },
  ),
);
