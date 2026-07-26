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
            className="relative w-full max-w-sm rounded-2xl bg-bg shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-amber-400 via-brand to-amber-400" />

            <button
              type="button"
              onClick={onCancel}
              aria-label={t("marketplace.unlockModal.cancel")}
              className="absolute right-4 top-5 size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <div className="relative flex justify-center overflow-hidden bg-linear-to-b from-brand-light to-bg pt-9 pb-7">
              <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/25 blur-3xl" />
              <div className="relative w-36 rounded-lg border border-line overflow-hidden shadow-lg pointer-events-none">
                <ResumePreview
                  singlePage
                  resume={{ ...DEMO_RESUME, customization: preset.customization }}
                />
              </div>
            </div>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-sm shadow-amber-500/30 ring-1 ring-amber-300/60">
                <Crown size={12} strokeWidth={2.5} />
                {t("marketplace.premiumBadge")}
              </span>
              <h2 className="text-xl font-bold text-text mt-3">
                {t(`marketplace.styleNames.${preset.styleKey}`)}
              </h2>
              <p className="text-sm text-text-secondary mt-1.5">
                {t("marketplace.unlockModal.description")}
              </p>

              <div className="mt-6 space-y-2.5">
                <Button className="w-full" onClick={onUnlock}>
                  {t("marketplace.unlockModal.unlockCta")}
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={onCancel}
                >
                  {t("marketplace.unlockModal.cancel")}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
