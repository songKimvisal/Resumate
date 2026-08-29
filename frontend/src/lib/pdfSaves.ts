import type { PackId } from "../types/billing";

/** Free accounts start with one PDF save. */
export const FREE_PDF_SAVES = 1;

/** Extra PDF saves granted when a pack is purchased. AI and design packs keep the free 1. */
export const PDFS_BY_PACK: Record<PackId, number> = {
  design: 0,
  "ai-basic": 0,
  "ai-plus": 0,
  "ai-pro": 0,
  "both-starter": 1,
  "both-standard": 2,
  "both-everything": 5,
};

export function pdfsForPack(packId: PackId): number {
  return PDFS_BY_PACK[packId];
}

export function remainingPdfs(total: number, used: number): number {
  return Math.max(0, total - used);
}
