import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentProvider } from "../types/billing";

// Saved cards live at PayWay (lib/api/cards.ts).
interface PaymentMethodState {
  preferredMethod: PaymentProvider;
  setPreferredMethod: (method: PaymentProvider) => void;
}

export const usePaymentMethodStore = create<PaymentMethodState>()(
  persist(
    (set) => ({
      preferredMethod: "khqr",
      setPreferredMethod: (method) => set({ preferredMethod: method }),
    }),
    {
      name: "resumate-payment-method",
      // Drops v1's mock saved card.
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<PaymentMethodState>;
        return {
          preferredMethod:
            state.preferredMethod === "stripe" ? "stripe" : "khqr",
        } as PaymentMethodState;
      },
    },
  ),
);
