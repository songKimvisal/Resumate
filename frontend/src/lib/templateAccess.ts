import type { PackId } from "../types/billing";

/** How many premium templates a pack can unlock. 0 = writing-help only. */
export function templateSlotsForPack(packId: PackId | null | undefined): number {
  switch (packId) {
    case "both-everything":
      return Number.POSITIVE_INFINITY;
    case "both-standard":
      return 3;
    case "design":
    case "both-starter":
      return 1;
    default:
      return 0;
  }
}

export function packIncludesTemplates(packId: PackId): boolean {
  return templateSlotsForPack(packId) > 0;
}

export function packUnlocksAllTemplates(packId: PackId): boolean {
  return packId === "both-everything";
}

/** Server slot count: -1 means every premium template is unlocked. */
export function hasTemplateAccess(
  templateId: string,
  unlockedIds: string[],
  slots: number,
): boolean {
  if (unlockedIds.includes(templateId)) return true;
  return slots < 0;
}

/** Free templates plus premium ones the user has already unlocked. */
export function canUseTemplate(
  preset: { id: string; tier: "free" | "premium" },
  unlockedIds: string[],
  slots: number,
): boolean {
  if (preset.tier === "free") return true;
  return hasTemplateAccess(preset.id, unlockedIds, slots);
}

export function canClaimTemplateSlot(
  slots: number,
  unlockedCount: number,
): boolean {
  return remainingTemplateSlots(slots, unlockedCount) > 0;
}

/** Finite slots still left to pick. 0 if none, or if everything is already unlocked. */
export function remainingTemplateSlots(
  slots: number,
  unlockedCount: number,
): number {
  if (slots <= 0) return 0;
  return Math.max(0, slots - unlockedCount);
}

export function hasDesignAccess(slots: number): boolean {
  return slots !== 0;
}
