import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

// Cycles through a few short "status" messages while we wait for the
// backend + Gemini to respond, so the wait feels active instead of frozen.
// Purely cosmetic - it doesn't know the real progress, it just rotates.
const STEP_KEYS = [
  "marketplace.aiPicker.loadingStep1",
  "marketplace.aiPicker.loadingStep2",
  "marketplace.aiPicker.loadingStep3",
] as const;

const STEP_DURATION_MS = 1400;

export default function AiGeneratingLoader() {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
    }, STEP_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl bg-bg px-8 py-9 text-center shadow-2xl ring-1 ring-line/60"
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.18 }}
      >
        <div className="relative flex size-14 items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-brand/15"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.15, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="relative flex size-10 items-center justify-center rounded-full bg-brand text-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={18} strokeWidth={2.5} />
          </motion.span>
        </div>

        <div className="h-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              className="text-sm font-medium text-text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {t(STEP_KEYS[stepIndex])}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
