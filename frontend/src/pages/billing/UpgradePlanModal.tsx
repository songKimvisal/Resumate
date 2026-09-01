import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { usePacks } from "../../hooks/usePacks";
import { NeedTabs, PackCard, PackCarousel } from "../../components/home/PackPicker";
import type { NeedId, PackId } from "../../types/billing";

export default function UpgradePlanModal({
  open,
  onClose,
  onSelectPack,
  initialNeed = "both",
}: {
  open: boolean;
  onClose: () => void;
  onSelectPack: (packId: PackId) => void;
  initialNeed?: NeedId;
}) {
  const { t } = useTranslation();
  const { byNeed } = usePacks();
  const [need, setNeed] = useState<NeedId>(initialNeed);

  useEffect(() => {
    if (open) setNeed(initialNeed);
  }, [open, initialNeed]);
  const packs = byNeed[need];
  const popularBadge = t(
    need === "both" ? "home.pricing.bestValue" : "home.pricing.mostPopular",
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="flex min-h-dvh items-center justify-center p-3 sm:p-6">
            <motion.div
              className="relative my-auto w-full max-w-5xl rounded-2xl bg-bg px-4 py-8 shadow-xl sm:px-8"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label={t("billing.upgradeModal.close")}
                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text sm:right-4 sm:top-4"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <h2 className="px-8 text-center text-xl font-bold text-text sm:text-2xl">
                {t("billing.upgradeModal.title")}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-center text-sm text-text-secondary">
                {t("billing.upgradeModal.subtitle")}
              </p>

              <div className="mt-5">
                <NeedTabs
                  value={need}
                  onChange={setNeed}
                  label={t("home.pricing.needLabel")}
                />
                <p className="mt-2.5 text-center text-sm text-text-secondary">
                  {t(`home.pricing.${need}.label`)}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {need === "design" ? (
                  <motion.div
                    key="design"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mx-auto mt-6 max-w-sm"
                  >
                    <PackCard
                      pack={packs[0]}
                      onSelect={() => onSelectPack("design")}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={need}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mt-6"
                  >
                    <PackCarousel
                      packs={packs}
                      popularBadge={popularBadge}
                      onSelect={onSelectPack}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
