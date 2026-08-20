import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/UseAuth";
import { setPendingPlan } from "../../lib/pendingPlan";
import type { PlanId } from "../../types/billing";

type NeedId = "design" | "ai" | "both";

interface PackCopy {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const NEED_IDS: NeedId[] = ["design", "ai", "both"];
const AI_PLAN_IDS: PlanId[] = ["starter", "starter", "pro"];
const BOTH_PLAN_IDS: PlanId[] = ["starter", "starter", "pro"];

function FeatureCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text">
      <CircleCheck
        className="text-brand shrink-0"
        size={16}
        strokeWidth={2.5}
      />
      {children}
    </li>
  );
}

export default function Pricing() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [need, setNeed] = useState<NeedId>("both");

  const handlePlanClick = (planId: PlanId) => {
    if (loading) return;
    if (planId === "free") {
      navigate(user ? "/dashboard" : "/login");
      return;
    }
    if (user) {
      navigate("/billing/payment", { state: { plan: planId } });
    } else {
      setPendingPlan(planId);
      navigate("/login");
    }
  };

  const aiPacks = t("home.pricing.ai.packs", {
    returnObjects: true,
  }) as PackCopy[];
  const bothPacks = t("home.pricing.both.packs", {
    returnObjects: true,
  }) as PackCopy[];

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 py-24">
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        {t("home.pricing.title")}{" "}
        <span className="text-brand italic">
          {t("home.pricing.titleAccent")}
        </span>
      </h2>
      <p className="mt-4 text-text-secondary text-center max-w-md mx-auto">
        {t("home.pricing.subtitle")}
      </p>

      <div
        role="radiogroup"
        aria-label={t("home.pricing.needLabel")}
        className="mt-10 flex justify-center"
      >
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-line p-1">
          {NEED_IDS.map((id) => {
            const selected = need === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setNeed(id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "bg-brand text-white"
                    : "text-text-secondary hover:text-text",
                )}
              >
                {t(`home.pricing.needs.${id}.title`)}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {need === "design" && (
          <motion.div
            key="design"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-12 mx-auto max-w-sm"
          >
            <PackCard
              pack={{
                name: t("home.pricing.design.name"),
                price: t("home.pricing.design.price"),
                period: t("home.pricing.design.period"),
                features: [t("home.pricing.design.desc")],
                cta: t("home.pricing.design.cta"),
                popular: true,
              }}
              loading={loading}
              onSelect={() => handlePlanClick("starter")}
            />
          </motion.div>
        )}

        {need === "ai" && (
          <motion.div
            key="ai"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-12 grid md:grid-cols-3 gap-6 items-stretch"
          >
            {aiPacks.map((pack, i) => (
              <PackCard
                key={pack.name}
                pack={pack}
                badge={
                  pack.popular ? t("home.pricing.mostPopular") : undefined
                }
                loading={loading}
                onSelect={() => handlePlanClick(AI_PLAN_IDS[i])}
              />
            ))}
          </motion.div>
        )}

        {need === "both" && (
          <motion.div
            key="both"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-12 grid md:grid-cols-3 gap-6 items-stretch"
          >
            {bothPacks.map((pack, i) => (
              <PackCard
                key={pack.name}
                pack={pack}
                badge={
                  pack.popular ? t("home.pricing.bestValue") : undefined
                }
                loading={loading}
                onSelect={() => handlePlanClick(BOTH_PLAN_IDS[i])}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <p className="text-sm text-text-secondary">
          {t("home.pricing.freeNote")}
        </p>
        <Button
          variant="outline"
          size="compact"
          disabled={loading}
          onClick={() => handlePlanClick("free")}
        >
          {t("home.pricing.freeCta")}
        </Button>
      </div>
    </section>
  );
}

function PackCard({
  pack,
  badge,
  loading,
  onSelect,
}: {
  pack: PackCopy;
  badge?: string;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl bg-bg p-8 text-left",
        pack.popular ? "border-2 border-brand" : "border border-line",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-text">{pack.name}</p>
        {badge && (
          <span className="text-xs font-semibold text-brand">{badge}</span>
        )}
      </div>
      <p className="mt-3">
        <span className="text-4xl font-bold">${pack.price}</span>
        {pack.period ? (
          <span className="ml-1.5 text-sm text-text-secondary">
            {pack.period}
          </span>
        ) : null}
      </p>
      <ul className="mt-6 flex-1 space-y-2.5">
        {pack.features.map((feature) => (
          <FeatureCheck key={feature}>{feature}</FeatureCheck>
        ))}
      </ul>
      <Button
        className="w-full mt-8"
        variant={pack.popular ? "default" : "outline"}
        disabled={loading}
        onClick={onSelect}
      >
        {pack.cta}
      </Button>
    </div>
  );
}
