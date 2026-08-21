import type { PlanId } from "../types/billing";

type PayablePlanId = Exclude<PlanId, "free">;

const PENDING_PLAN_KEY = "resumate:pendingPlan";
const ENTERED_KEY = "resumate-entered";
const STAY_HOME_KEY = "resumate-stay-home";

export const setPendingPlan = (plan: PayablePlanId) =>
  sessionStorage.setItem(PENDING_PLAN_KEY, plan);

export const getPendingPlan = (): PayablePlanId | null =>
  (sessionStorage.getItem(PENDING_PLAN_KEY) as PayablePlanId | null) ?? null;

export const clearPendingPlan = () => sessionStorage.removeItem(PENDING_PLAN_KEY);

export function markAppEntered() {
  sessionStorage.setItem(ENTERED_KEY, "1");
}

export function hasAppEntered() {
  return sessionStorage.getItem(ENTERED_KEY) === "1";
}

/** After signup, keep the user on the marketing home instead of Dashboard. */
export function markStayOnHome() {
  sessionStorage.setItem(STAY_HOME_KEY, "1");
}

export function consumeStayOnHome() {
  const stay = sessionStorage.getItem(STAY_HOME_KEY) === "1";
  if (stay) sessionStorage.removeItem(STAY_HOME_KEY);
  return stay;
}

export function shouldStayOnHome() {
  return sessionStorage.getItem(STAY_HOME_KEY) === "1";
}

export function clearStayOnHome() {
  sessionStorage.removeItem(STAY_HOME_KEY);
}
