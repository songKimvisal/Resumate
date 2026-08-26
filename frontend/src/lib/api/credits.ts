import { requestBackend } from "./client";
import type { PackId } from "../../types/billing";

export interface CreditBalance {
  total: number;
  used: number;
  remaining: number;
}

export function creditsFromErrorBody(body: unknown): CreditBalance | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail?: { credits?: CreditBalance } }).detail;
  const credits = detail?.credits;
  if (
    !credits ||
    typeof credits.total !== "number" ||
    typeof credits.used !== "number"
  ) {
    return null;
  }
  return credits;
}

export function getAiCredits() {
  return requestBackend<CreditBalance>("/api/credits");
}

export function grantAiCredits(packId: PackId) {
  return requestBackend<CreditBalance>("/api/credits/grant", {
    method: "POST",
    body: { pack_id: packId },
  });
}
