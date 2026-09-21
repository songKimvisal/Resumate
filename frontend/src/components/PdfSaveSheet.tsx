import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Download, X } from "lucide-react";
import {
  isInAppBrowser,
  savePdfFromGesture,
  usePdfSaveSheet,
} from "../lib/pdfDelivery";

export default function PdfSaveSheet() {
  const { t } = useTranslation();
  const file = usePdfSaveSheet((s) => s.file);
  const close = usePdfSaveSheet((s) => s.close);
  const [saving, setSaving] = useState(false);

  const canShare =
    !!file &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });
  const hint = canShare
    ? t("pdfSave.hintShare")
    : isInAppBrowser()
      ? t("pdfSave.hintInApp")
      : t("pdfSave.hintOpen");

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const result = await savePdfFromGesture(file);
      if (result !== "pending") close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-md rounded-t-2xl bg-bg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label={t("pdfSave.close")}
              className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <h2 className="pr-10 text-lg font-bold text-text">
              {t("pdfSave.title")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              {hint}
            </p>
            <p className="mt-3 truncate text-xs text-text-secondary">
              {file.name}
            </p>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              <Download size={16} strokeWidth={2} />
              {canShare ? t("pdfSave.save") : t("pdfSave.open")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
