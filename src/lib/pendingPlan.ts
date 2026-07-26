import type { PlanId } from "../types/billing";

type PayablePlanId = Exclude<PlanId, "free">;

const KEY = "resumate:pendingPlan";

export const setPendingPlan = (plan: PayablePlanId) =>
  sessionStorage.setItem(KEY, plan);

export const getPendingPlan = (): PayablePlanId | null =>
  (sessionStorage.getItem(KEY) as PayablePlanId | null) ?? null;

export const clearPendingPlan = () => sessionStorage.removeItem(KEY);
