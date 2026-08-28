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
import type { PackId, PlanId } from "../../types/billing";
import { usePacks } from "../../hooks/usePacks";
import { useAiCredits } from "../../hooks/useAiCredits";
import UpgradePlanModal from "../billing/UpgradePlanModal";
import PageTitle from "../../components/layout/PageTitle";

const PLAN_LIMITS: Record<PlanId, { resumesSaved: number }> = {
  free: { resumesSaved: 1 },
  starter: { resumesSaved: 1 },
  pro: { resumesSaved: 5 },
};

const PACK_LIMITS: Partial<Record<PackId, { resumesSaved: number }>> = {
  design: { resumesSaved: 1 },
  "ai-basic": { resumesSaved: 1 },
  "ai-plus": { resumesSaved: 1 },
  "ai-pro": { resumesSaved: 1 },
  "both-starter": { resumesSaved: 1 },
  "both-standard": { resumesSaved: 2 },
  "both-everything": { resumesSaved: 5 },
};

export default function AiUsage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = useSubscriptionStore((s) => s.plan);
  const lastPackId = useSubscriptionStore((s) => s.lastPackId);
  const { used: aiCreditsUsed, total: aiCreditsTotal } = useAiCredits();
  const pricingPlans = usePricingPlans();
  const { all: packs } = usePacks();
  const currentPack = packs.find((p) => p.id === lastPackId);
  const currentPlan =
    currentPack ??
    pricingPlans.find((p) => p.id === plan) ??
    pricingPlans[0];

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [resumesSavedCount, setResumesSavedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getResumesByUser(user.id)
      .then((data) => setResumesSavedCount(data.length))
      .catch(() => setResumesSavedCount(0));
  }, [user]);

  const limits =
    (lastPackId && PACK_LIMITS[lastPackId]) || PLAN_LIMITS[plan];
  const metrics = [
    {
      key: "aiCredits" as const,
      icon: Sparkles,
      used: Math.min(aiCreditsUsed, aiCreditsTotal),
      total: aiCreditsTotal,
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
      <PageTitle
        text={t("aiUsage.title")}
        accent={t("aiUsage.titleAccent")}
      />
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
              {t("aiUsage.planCard.creditsNote")}
            </p>
          </div>
        </div>
        <Button size="compact" onClick={() => setUpgradeModalOpen(true)}>
          {t("billing.currentPlan.upgradeCta")}
        </Button>
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
            const exhausted = total > 0 && used >= total;
            const emptyCredits = key === "aiCredits" && total === 0;

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
                    exhausted
                      ? "flex items-center justify-end gap-1 text-destructive"
                      : "text-text-secondary",
                  )}
                >
                  {exhausted && <AlertCircle size={12} strokeWidth={2} />}
                  {emptyCredits
                    ? t("billing.currentPlan.noCredits")
                    : exhausted
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
        onClose={() => setUpgradeModalOpen(false)}
        onSelectPack={(packId) => {
          setUpgradeModalOpen(false);
          navigate("/billing/payment", { state: { pack: packId } });
        }}
      />
    </div>
  );
}
