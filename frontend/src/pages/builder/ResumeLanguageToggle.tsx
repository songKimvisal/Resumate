import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

export function ResumeLanguageToggle({
  value,
  onChange,
  showHint = false,
}: {
  value: "en" | "km";
  onChange: (lang: "en" | "km") => void;
  showHint?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-text-secondary whitespace-nowrap">
          {t("builder.resumeLanguage")}
        </p>
        <div
          role="group"
          aria-label={t("builder.resumeLanguage")}
          className="inline-flex rounded-full border border-line bg-surface-2 p-1"
        >
          <button
            type="button"
            onClick={() => onChange("en")}
            aria-pressed={value === "en"}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              value === "en"
                ? "bg-bg text-text shadow-sm"
                : "text-text-secondary hover:text-text",
            )}
          >
            {t("builder.resumeLanguageEn")}
          </button>
          <button
            type="button"
            onClick={() => onChange("km")}
            aria-pressed={value === "km"}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              value === "km"
                ? "bg-bg text-text shadow-sm"
                : "text-text-secondary hover:text-text",
            )}
          >
            {t("builder.resumeLanguageKm")}
          </button>
        </div>
      </div>
      {showHint && (
        <p className="mt-2 text-sm text-text-secondary">
          {t("builder.resumeLanguageHint")}
        </p>
      )}
    </div>
  );
}
