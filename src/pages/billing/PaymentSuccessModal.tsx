import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../components/ui/button";
import mascot from "../../assets/logo/mascot.png";

export default function PaymentSuccessModal({
  open,
  planName,
  onGoToDashboard,
}: {
  open: boolean;
  planName: string;
  onGoToDashboard: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-bg p-6 sm:p-8 shadow-xl flex items-center gap-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-text">
                {t("billing.payment.success.title")}{" "}
                <span className="text-success">
                  {t("billing.payment.success.titleAccent")}
                </span>
              </h2>
              <p className="text-sm text-text-secondary mt-2">
                {t("billing.payment.success.description", { plan: planName })}
              </p>

              <Button className="mt-6 w-full" onClick={onGoToDashboard}>
                {t("billing.payment.success.cta")}
              </Button>
            </div>

            <img
              src={mascot}
              alt=""
              className="hidden sm:block w-24 shrink-0 select-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
