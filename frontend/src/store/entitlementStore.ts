import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EntitlementState {
  unlockedTemplateIds: string[];
  isUnlocked: (templateId: string) => boolean;
  unlockTemplate: (templateId: string) => void;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set, get) => ({
      unlockedTemplateIds: [],
      isUnlocked: (templateId) => get().unlockedTemplateIds.includes(templateId),
      unlockTemplate: (templateId) =>
        set((s) =>
          s.unlockedTemplateIds.includes(templateId)
            ? s
            : { unlockedTemplateIds: [...s.unlockedTemplateIds, templateId] },
        ),
    }),
    { name: "resumate-entitlements" },
  ),
);
