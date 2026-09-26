import { isPackId, type PackId } from "../types/billing";

const PENDING_PLAN_KEY = "resumate:pendingPlan";
const PENDING_TEMPLATE_KEY = "resumate:pendingTemplate";
const PENDING_TEMPLATE_AS_NEW_KEY = "resumate:pendingTemplateAsNew";
const ENTERED_KEY = "resumate-entered";
const STAY_HOME_KEY = "resumate-stay-home";

export const setPendingPlan = (plan: PackId) =>
  sessionStorage.setItem(PENDING_PLAN_KEY, plan);

export const getPendingPlan = (): PackId | null => {
  const value = sessionStorage.getItem(PENDING_PLAN_KEY);
  return isPackId(value) ? value : null;
};

export const clearPendingPlan = () => sessionStorage.removeItem(PENDING_PLAN_KEY);

export const setPendingTemplateId = (
  templateId: string,
  asNewResume = true,
) => {
  sessionStorage.setItem(PENDING_TEMPLATE_KEY, templateId);
  sessionStorage.setItem(PENDING_TEMPLATE_AS_NEW_KEY, asNewResume ? "1" : "0");
};

export const consumePendingTemplateId = (): string | null => {
  const value = sessionStorage.getItem(PENDING_TEMPLATE_KEY);
  sessionStorage.removeItem(PENDING_TEMPLATE_KEY);
  return value;
};

/** Reads the pending template without clearing it - for display only
 * (e.g. showing its name/price on the payment page before checkout runs). */
export const peekPendingTemplateId = (): string | null =>
  sessionStorage.getItem(PENDING_TEMPLATE_KEY);

export const consumePendingTemplateAsNewResume = (): boolean => {
  const value = sessionStorage.getItem(PENDING_TEMPLATE_AS_NEW_KEY);
  sessionStorage.removeItem(PENDING_TEMPLATE_AS_NEW_KEY);
  return value !== "0";
};

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

const PAYWAY_CHECKOUT_KEY = "resumate:paywayCheckout";

/** Router state is lost while the shopper is on PayWay's page. */
export const setPendingPaywayCheckout = (tranId: string, checkout: unknown) =>
  sessionStorage.setItem(PAYWAY_CHECKOUT_KEY, JSON.stringify({ tranId, checkout }));

export const getPendingPaywayCheckout = (tranId: string): unknown => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PAYWAY_CHECKOUT_KEY) ?? "null");
    return saved?.tranId === tranId ? saved.checkout : null;
  } catch {
    return null;
  }
};

export const clearPendingPaywayCheckout = () =>
  sessionStorage.removeItem(PAYWAY_CHECKOUT_KEY);
