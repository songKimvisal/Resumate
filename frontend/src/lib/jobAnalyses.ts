import type { PackId } from "../types/billing";

/** Job analyses granted by pack. Each run also covers interview + skill-gap for that job. */
export const ANALYSES_BY_PACK: Record<PackId, number> = {
  design: 0,
  "ai-basic": 1,
  "ai-plus": 3,
  "ai-pro": 5,
  "both-starter": 1,
  "both-standard": 3,
  "both-everything": 5,
};

export function analysesForPack(packId: PackId): number {
  return ANALYSES_BY_PACK[packId];
}

export function remainingAnalyses(total: number, used: number): number {
  return Math.max(0, total - used);
}
