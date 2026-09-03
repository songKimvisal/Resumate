import { useTranslation } from "react-i18next";
import type { PlanId } from "../types/billing";

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: string;
  tagline: string;
  includesLabel: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

type RawPricingPlan = Omit<PricingPlan, "id">;
const PLAN_ID_ORDER: PlanId[] = ["free", "starter", "pro"];

export function usePricingPlans(): PricingPlan[] {
  const { t } = useTranslation();
  const plans = t("home.pricing.plans", {
    returnObjects: true,
  }) as RawPricingPlan[];

  return plans.map((plan, i) => ({
    ...plan,
    id: PLAN_ID_ORDER[i],
  }));
}
