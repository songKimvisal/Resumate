import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../../hooks/UseAuth";
import { setPendingPlan } from "../../lib/session";
import { usePacks } from "../../hooks/usePacks";
import type { NeedId, PackId } from "../../types/billing";
import { NeedTabs, PackCard, PackCarousel } from "./PackPicker";

export default function Pricing() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { byNeed } = usePacks();
  const [need, setNeed] = useState<NeedId>("both");

  const goFree = () => {
    if (loading) return;
    navigate(user ? "/dashboard" : "/login");
  };

  const handlePackClick = (packId: PackId) => {
    if (loading) return;
    if (user) {
      navigate("/billing/payment", { state: { pack: packId } });
    } else {
      setPendingPlan(packId);
      navigate("/login");
    }
  };

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">
        {t("home.pricing.title")}{" "}
        <span className="text-brand italic">
          {t("home.pricing.titleAccent")}
        </span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-text-secondary sm:text-base">
        {t("home.pricing.subtitle")}
      </p>

      <div className="mt-8 sm:mt-10">
        <NeedTabs
          value={need}
          onChange={setNeed}
          label={t("home.pricing.needLabel")}
        />
      </div>

      <AnimatePresence mode="wait">
        {need === "design" && (
          <motion.div
            key="design"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mx-auto mt-8 max-w-sm sm:mt-10"
          >
            <PackCard
              pack={byNeed.design[0]}
              loading={loading}
              onSelect={() => handlePackClick("design")}
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
            className="mt-8 sm:mt-10"
          >
            <PackCarousel
              packs={byNeed.ai}
              popularBadge={t("home.pricing.mostPopular")}
              loading={loading}
              onSelect={handlePackClick}
            />
          </motion.div>
        )}

        {need === "both" && (
          <motion.div
            key="both"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-8 sm:mt-10"
          >
            <PackCarousel
              packs={byNeed.both}
              popularBadge={t("home.pricing.bestValue")}
              loading={loading}
              onSelect={handlePackClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-sm text-text-secondary">
        {t("home.pricing.freeNote")}{" "}
        <button
          type="button"
          disabled={loading}
          onClick={goFree}
          className="font-semibold text-brand underline-offset-2 hover:underline disabled:opacity-50"
        >
          {t("home.pricing.freeCta")}
        </button>
      </p>
    </section>
  );
}
