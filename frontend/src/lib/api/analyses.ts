import { requestBackend } from "./client";
import type { PackId } from "../../types/billing";

export interface AnalysisBalance {
  total: number;
  used: number;
  remaining: number;
}

export function analysesFromErrorBody(body: unknown): AnalysisBalance | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail?: { analyses?: AnalysisBalance } }).detail;
  const analyses = detail?.analyses;
  if (
    !analyses ||
    typeof analyses.total !== "number" ||
    typeof analyses.used !== "number"
  ) {
    return null;
  }
  return analyses;
}

export function getJobAnalyses() {
  return requestBackend<AnalysisBalance>("/api/analyses");
}

export function grantJobAnalyses(packId: PackId) {
  return requestBackend<AnalysisBalance>("/api/analyses/grant", {
    method: "POST",
    body: { pack_id: packId },
  });
}
