import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { RewriteVariation } from "../../lib/api/smartRewrite";

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function SmartRewriteSuggestions({
  variations,
  onSelect,
  onDismiss,
}: {
  variations: RewriteVariation[];
  onSelect: (chosen: string) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="mt-3 rounded-2xl border border-line/70 bg-surface-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text">
              {t("builder.personal.suggestions")}
            </h4>
            <button
              onClick={onDismiss}
              className="rounded-full p-1 text-text-secondary hover:bg-primary hover:text-primary-foreground"
              aria-label={t("builder.personal.close")}
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {variations.map((variation, i) => (
              <button
                key={i}
                onClick={() => onSelect(variation.text)}
                className="group rounded-xl border border-line/60 bg-bg p-3.5 text-left transition hover:border-brand hover:bg-brand/5"
              >
                <span className="mb-1 inline-block text-xs font-semibold text-brand">
                  {variation.label}
                </span>
                <p className="text-sm text-text line-clamp-4">
                  {stripHtml(variation.text)}
                </p>
                <span className="mt-2 inline-block text-xs font-medium text-brand opacity-0 transition group-hover:opacity-100">
                  {t("builder.personal.useThisVersion")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
