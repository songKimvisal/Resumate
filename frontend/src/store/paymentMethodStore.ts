import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentProvider } from "../types/billing";

export interface SavedCard {
  brand: string;
  last4: string;
  expiry: string;
}

interface PaymentMethodState {
  preferredMethod: PaymentProvider;
  savedCard: SavedCard | null;
  setPreferredMethod: (method: PaymentProvider) => void;
  saveCard: (card: SavedCard) => void;
  clearCard: () => void;
}

export const usePaymentMethodStore = create<PaymentMethodState>()(
  persist(
    (set) => ({
      preferredMethod: "khqr",
      savedCard: null,
      setPreferredMethod: (method) => set({ preferredMethod: method }),
      saveCard: (card) => set({ savedCard: card, preferredMethod: "stripe" }),
      clearCard: () =>
        set((s) => ({
          savedCard: null,
          preferredMethod: s.preferredMethod === "stripe" ? "khqr" : s.preferredMethod,
        })),
    }),
    {
      name: "resumate-payment-method",
      version: 1,
    },
  ),
);
