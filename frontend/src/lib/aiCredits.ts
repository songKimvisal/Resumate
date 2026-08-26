import type { PackId, PlanId } from "../types/billing";

export const AI_CREDITS_BY_PACK: Record<PackId, number> = {
  design: 0,
  "ai-basic": 8,
  "ai-plus": 25,
  "ai-pro": 60,
  "both-starter": 8,
  "both-standard": 25,
  "both-everything": 60,
};

export const AI_CREDITS_BY_PLAN: Record<PlanId, number> = {
  free: 0,
  starter: 8,
  pro: 60,
};

export function creditsForPack(packId: PackId): number {
  return AI_CREDITS_BY_PACK[packId];
}

export function creditsForPlan(plan: PlanId): number {
  return AI_CREDITS_BY_PLAN[plan];
}

export function remainingAiCredits(total: number, used: number): number {
  return Math.max(0, total - used);
}
