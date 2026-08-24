import { isPackId, type PackId } from "../types/billing";

const PENDING_PLAN_KEY = "resumate:pendingPlan";
const ENTERED_KEY = "resumate-entered";
const STAY_HOME_KEY = "resumate-stay-home";

export const setPendingPlan = (plan: PackId) =>
  sessionStorage.setItem(PENDING_PLAN_KEY, plan);

export const getPendingPlan = (): PackId | null => {
  const value = sessionStorage.getItem(PENDING_PLAN_KEY);
  return isPackId(value) ? value : null;
};

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
