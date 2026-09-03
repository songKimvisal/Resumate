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
  ownedIds: string[] = [],
): boolean {
  if (unlockedIds.includes(templateId)) return true;
  if (ownedIds.includes(templateId)) return true;
  return slots < 0;
}

/** Free templates plus premium ones the user has unlocked (pack slot) or
 * bought directly. */
export function canUseTemplate(
  preset: { id: string; tier: "free" | "premium" },
  unlockedIds: string[],
  slots: number,
  ownedIds: string[] = [],
): boolean {
  if (preset.tier === "free") return true;
  return hasTemplateAccess(preset.id, unlockedIds, slots, ownedIds);
}

/**
 * Whether colors/fonts/layout are unlocked for whatever template is
 * currently active. A directly-purchased premium template ($1.99) bundles
 * its own customization, so it never needs the separate flat unlock; a
 * free template needs the standalone $1 "unlock customization" purchase
 * (or an old pack that already granted it account-wide).
 */
export function hasCustomizationAccess(
  activeTemplateTier: "free" | "premium" | undefined,
  hasActiveTemplateAccess: boolean,
  customizationUnlocked: boolean,
): boolean {
  if (activeTemplateTier === "premium") return hasActiveTemplateAccess;
  return customizationUnlocked;
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

/**
 * Flat, one-time prices for the standalone (non-pack) purchase paths.
 * Bare numeric strings (no "$"), matching the `home.pricing.*.price` i18n
 * convention where the "$" is added by the surrounding translation string.
 */
export const PREMIUM_TEMPLATE_PRICE = "1.99";
export const CUSTOMIZATION_UNLOCK_PRICE = "1.00";
