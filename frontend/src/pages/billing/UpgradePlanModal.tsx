import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { CircleCheck, Crown, X, Zap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { usePricingPlans } from "../../hooks/usePricingPlans";
import type { PlanId } from "../../types/billing";

export default function UpgradePlanModal({
  open,
  currentPlan,
  onClose,
  onSelectPlan,
}: {
  open: boolean;
  currentPlan: PlanId;
  onClose: () => void;
  onSelectPlan: (plan: "starter" | "pro") => void;
}) {
  const { t } = useTranslation();
  const plans = usePricingPlans().filter(
    (plan): plan is typeof plan & { id: "starter" | "pro" } =>
      plan.id === "starter" || plan.id === "pro",
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-3xl rounded-2xl bg-bg p-6 sm:p-8 shadow-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t("billing.upgradeModal.close")}
              className="absolute right-4 top-4 size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <h2 className="text-xl font-bold text-text">
              {t("billing.upgradeModal.title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t("billing.upgradeModal.subtitle")}
            </p>

            <div className="mt-6 grid sm:grid-cols-2 gap-5 sm:gap-0 sm:items-center relative">
              {plans.map((plan, i) => {
                const isCurrent = plan.id === currentPlan;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl p-6 space-y-5 bg-bg",
                      plan.popular
                        ? "border-2 border-brand"
                        : "border border-line",
                      i === 0 ? "sm:mr-6" : "sm:ml-6",
                    )}
                  >
                    <div className="space-y-2">
                      <div className="h-7 flex items-center">
                        {plan.popular ? (
                          <span className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                            {t("home.pricing.mostPopular")}
                            <Zap size={14} fill="white" />
                          </span>
                        ) : (
                          <Crown size={22} />
                        )}
                      </div>
                      <p className="text-sm font-bold tracking-wide uppercase">
                        {plan.name}
                      </p>
                      <p>
                        <span className="text-3xl font-extrabold text-text">
                          ${plan.price}
                        </span>
                        <span className="text-text-secondary text-sm">
                          /{t("home.pricing.month")}
                        </span>
                      </p>
                      <p className="text-sm text-text-secondary">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="flex-1 space-y-3">
                      <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
                        {plan.includesLabel}
                      </p>
                      <ul className="space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex gap-2.5 text-sm">
                            <CircleCheck
                              className="text-brand shrink-0 mt-0.5"
                              size={16}
                              strokeWidth={2.5}
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className="w-full"
                      variant={
                        isCurrent
                          ? "outline"
                          : plan.popular
                            ? "default"
                            : "outline"
                      }
                      disabled={isCurrent}
                      onClick={() => onSelectPlan(plan.id)}
                    >
                      {isCurrent
                        ? t("billing.upgradeModal.currentPlanCta")
                        : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
