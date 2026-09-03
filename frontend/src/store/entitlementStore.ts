import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EntitlementState {
  unlockedTemplateIds: string[];
  /** Templates bought directly for $1.99, outside the pack-slot system. */
  ownedTemplateIds: string[];
  templateSlots: number;
  /** Flat $1 purchase: colors/fonts/layout on free templates, account-wide. */
  customizationUnlocked: boolean;
  isUnlocked: (templateId: string) => boolean;
  setEntitlements: (
    unlockedTemplateIds: string[],
    templateSlots: number,
    ownedTemplateIds: string[],
    customizationUnlocked: boolean,
  ) => void;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set, get) => ({
      unlockedTemplateIds: [],
      ownedTemplateIds: [],
      templateSlots: 0,
      customizationUnlocked: false,
      isUnlocked: (templateId) =>
        get().unlockedTemplateIds.includes(templateId) ||
        get().ownedTemplateIds.includes(templateId),
      setEntitlements: (
        unlockedTemplateIds,
        templateSlots,
        ownedTemplateIds,
        customizationUnlocked,
      ) =>
        set({
          unlockedTemplateIds,
          templateSlots,
          ownedTemplateIds,
          customizationUnlocked,
        }),
    }),
    {
      name: "resumate-entitlements",
      version: 3,
      partialize: (s) => ({
        unlockedTemplateIds: s.unlockedTemplateIds,
        templateSlots: s.templateSlots,
        ownedTemplateIds: s.ownedTemplateIds,
        customizationUnlocked: s.customizationUnlocked,
      }),
      migrate: (persisted) => {
        const state = persisted as Partial<EntitlementState> | undefined;
        return {
          unlockedTemplateIds: Array.isArray(state?.unlockedTemplateIds)
            ? state.unlockedTemplateIds
            : [],
          templateSlots:
            typeof state?.templateSlots === "number" ? state.templateSlots : 0,
          ownedTemplateIds: Array.isArray(state?.ownedTemplateIds)
            ? state.ownedTemplateIds
            : [],
          customizationUnlocked: state?.customizationUnlocked === true,
        };
      },
    },
  ),
);
