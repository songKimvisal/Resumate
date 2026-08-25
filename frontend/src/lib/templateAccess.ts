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

export function hasTemplateAccess(
  templateId: string,
  packId: PackId | null | undefined,
  unlockedIds: string[],
): boolean {
  if (unlockedIds.includes(templateId)) return true;
  return templateSlotsForPack(packId) === Number.POSITIVE_INFINITY;
}

export function canClaimTemplateSlot(
  packId: PackId | null | undefined,
  unlockedCount: number,
): boolean {
  return remainingTemplateSlots(packId, unlockedCount) > 0;
}

/** Finite slots still left to pick. 0 if the pack has none or unlocks everything. */
export function remainingTemplateSlots(
  packId: PackId | null | undefined,
  unlockedCount: number,
): number {
  const slots = templateSlotsForPack(packId);
  if (slots === 0 || !Number.isFinite(slots)) return 0;
  return Math.max(0, slots - unlockedCount);
}
