import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Copy, Leaf, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/UseAuth";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { usePricingPlans } from "../../hooks/usePricingPlans";
import { getResumesByUser } from "../../lib/api";
import type { PlanId } from "../../types/billing";
import UpgradePlanModal from "../billing/UpgradePlanModal";

const PLAN_ID_ORDER: PlanId[] = ["free", "starter", "pro"];

// Monthly allowances per plan, matching home.pricing.plans in the locale files.
const PLAN_LIMITS: Record<PlanId, { aiCredits: number; resumesSaved: number }> =
  {
    free: { aiCredits: 5, resumesSaved: 1 },
    starter: { aiCredits: 30, resumesSaved: 2 },
    pro: { aiCredits: 60, resumesSaved: 6 },
  };

// AI writing credit usage isn't tracked server-side yet, so mock a used
// count per plan; resumes saved below uses the real count from Supabase.
const AI_CREDITS_USED: Record<PlanId, number> = {
  free: 4,
  starter: 12,
  pro: 20,
};

const RESET_DAYS = 16;

export default function AiUsage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = useSubscriptionStore((s) => s.plan);
  const pricingPlans = usePricingPlans();
  const currentPlan =
    pricingPlans.find((p) => p.id === plan) ?? pricingPlans[0];
  const nextPlan = pricingPlans[PLAN_ID_ORDER.indexOf(plan) + 1];

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [resumesSavedCount, setResumesSavedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getResumesByUser(user.id)
      .then((data) => setResumesSavedCount(data.length))
      .catch(() => setResumesSavedCount(0));
  }, [user]);

  const limits = PLAN_LIMITS[plan];
  const metrics = [
    {
      key: "aiCredits" as const,
      icon: Sparkles,
      used: Math.min(AI_CREDITS_USED[plan], limits.aiCredits),
      total: limits.aiCredits,
    },
    {
      key: "resumesSaved" as const,
      icon: Copy,
      used: Math.min(resumesSavedCount, limits.resumesSaved),
      total: limits.resumesSaved,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold">
        <span className="text-text">{t("aiUsage.title")}</span>
      </h1>
      <p className="text-sm text-text-secondary mt-2">
        {t("aiUsage.subtitle")}
      </p>

      <div className="mt-8 flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-full border border-line shadow-sm p-2 pl-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Leaf size={20} strokeWidth={2} />
          </span>
          <div>
            <p className="font-bold text-text">
              {currentPlan.name} {t("aiUsage.planCard.planSuffix")}
            </p>
            <p className="text-sm text-text-secondary">
              {t("aiUsage.planCard.resetIn", { days: RESET_DAYS })}
            </p>
          </div>
        </div>
        {nextPlan && (
          <Button size="compact" onClick={() => setUpgradeModalOpen(true)}>
            {nextPlan.cta}
          </Button>
        )}
      </div>

      <div className="mt-4 w-full max-w-2xl rounded-2xl border border-line p-4 sm:p-5">
        <h2 className="font-bold text-text">{t("aiUsage.usageCard.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("aiUsage.usageCard.subtitle")}
        </p>

        <div className="mt-5 space-y-5">
          {metrics.map(({ key, icon: Icon, used, total }) => {
            const percent =
              total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            const limitReached = used >= total;

            return (
              <div key={key}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="text-sm text-text">
                      {t(`aiUsage.metrics.${key}`)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-brand">
                    {used} / {total}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand transition-[width]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p
                  className={cn(
                    "mt-1.5 text-right text-xs",
                    limitReached
                      ? "flex items-center justify-end gap-1 text-destructive"
                      : "text-text-secondary",
                  )}
                >
                  {limitReached && <AlertCircle size={12} strokeWidth={2} />}
                  {limitReached
                    ? t("aiUsage.metrics.limitReached")
                    : t("aiUsage.metrics.left", { count: total - used })}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <UpgradePlanModal
        open={upgradeModalOpen}
        currentPlan={plan}
        onClose={() => setUpgradeModalOpen(false)}
        onSelectPlan={(selected) => {
          setUpgradeModalOpen(false);
          navigate("/billing/payment", { state: { plan: selected } });
        }}
      />
    </div>
  );
}
