import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { CUSTOMIZATION_UNLOCK_PRICE } from "../../lib/templateAccess";
export default function UnlockCustomizationModal({
  open,
  onCancel,
}: {
  open: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const buyDirect = () => {
    onCancel();
    navigate("/billing/payment", { state: { flat: "customization" } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <div className="flex min-h-dvh items-center justify-center p-3 sm:p-6">
            <motion.div
              className="relative w-full max-w-sm rounded-2xl bg-bg px-5 py-6 text-center shadow-xl sm:px-6 sm:py-7"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onCancel}
                aria-label={t("builder.customizePage.customizationUnlock.cancel")}
                className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <h2 className="px-6 text-lg font-bold tracking-tight text-text">
                {t("builder.customizePage.customizationUnlock.title")}
              </h2>
              <p className="mt-1.5 text-sm text-text-secondary">
                {t("builder.customizePage.customizationUnlock.description")}
              </p>

              <Button className="mt-6 h-9 w-full" size="compact" onClick={buyDirect}>
                {t("builder.customizePage.customizationUnlock.cta", {
                  price: CUSTOMIZATION_UNLOCK_PRICE,
                })}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
