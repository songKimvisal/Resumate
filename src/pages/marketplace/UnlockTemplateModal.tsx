import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Crown, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import ResumePreview from "../../components/resume/ResumePreview";
import { DEMO_RESUME } from "../../data/demoResume";
import type { TemplatePreset } from "../../data/templates";

export default function UnlockTemplateModal({
  open,
  preset,
  onCancel,
  onUnlock,
}: {
  open: boolean;
  preset: TemplatePreset | null;
  onCancel: () => void;
  onUnlock: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && preset && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-2xl bg-bg p-6 sm:p-8 shadow-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("marketplace.unlockModal.cancel")}
              className="absolute right-4 top-4 size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <div className="mx-auto w-36 rounded-lg border border-line overflow-hidden pointer-events-none">
              <ResumePreview
                singlePage
                resume={{ ...DEMO_RESUME, customization: preset.customization }}
              />
            </div>

            <div className="mt-5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950">
                <Crown size={12} strokeWidth={2.5} />
                {t("marketplace.premiumBadge")}
              </span>
              <h2 className="text-lg font-bold text-text mt-3">
                {t(`marketplace.styleNames.${preset.styleKey}`)}
              </h2>
              <p className="text-sm text-text-secondary mt-1.5">
                {t("marketplace.unlockModal.description")}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button size="compact" variant="outline" onClick={onCancel}>
                {t("marketplace.unlockModal.cancel")}
              </Button>
              <Button size="compact" onClick={onUnlock}>
                {t("marketplace.unlockModal.unlockCta")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
