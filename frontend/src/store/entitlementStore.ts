import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EntitlementState {
  unlockedTemplateIds: string[];
  templateSlots: number;
  isUnlocked: (templateId: string) => boolean;
  setEntitlements: (unlockedTemplateIds: string[], templateSlots: number) => void;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set, get) => ({
      unlockedTemplateIds: [],
      templateSlots: 0,
      isUnlocked: (templateId) => get().unlockedTemplateIds.includes(templateId),
      setEntitlements: (unlockedTemplateIds, templateSlots) =>
        set({
          unlockedTemplateIds,
          templateSlots,
        }),
    }),
    {
      name: "resumate-entitlements",
      version: 2,
      partialize: (s) => ({
        unlockedTemplateIds: s.unlockedTemplateIds,
        templateSlots: s.templateSlots,
      }),
      migrate: (persisted) => {
        const state = persisted as Partial<EntitlementState> | undefined;
        return {
          unlockedTemplateIds: Array.isArray(state?.unlockedTemplateIds)
            ? state.unlockedTemplateIds
            : [],
          templateSlots:
            typeof state?.templateSlots === "number" ? state.templateSlots : 0,
        };
      },
    },
  ),
);
