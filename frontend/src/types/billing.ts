export type PlanId = "free" | "starter" | "pro";

export const PACK_IDS = [
  "design",
  "ai-basic",
  "ai-plus",
  "ai-pro",
  "both-starter",
  "both-standard",
  "both-everything",
] as const;

export type PackId = (typeof PACK_IDS)[number];
export type NeedId = "design" | "ai" | "both";

export type PaymentProvider = "khqr" | "stripe";

export function isPackId(value: unknown): value is PackId {
  return (
    typeof value === "string" && (PACK_IDS as readonly string[]).includes(value)
  );
}

export function packToPlanId(id: PackId): PlanId {
  if (id === "both-everything" || id === "ai-pro") return "pro";
  return "starter";
}
