import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";
import ResumePreview from "../../components/resume/ResumePreview";
import { DEMO_RESUME } from "../../data/demoResume";
import type { TemplatePreset } from "../../data/templates";
import { useEntitlementStore } from "../../store/entitlementStore";
import { cn } from "../../lib/utils";

export default function TemplateCard({
  preset,
  onSelect,
}: {
  preset: TemplatePreset;
  onSelect: (preset: TemplatePreset) => void;
}) {
  const { t } = useTranslation();
  const isPremium = preset.tier === "premium";
  const isUnlocked = useEntitlementStore((s) => s.isUnlocked(preset.id));
  const resume = useMemo(
    () => ({ ...DEMO_RESUME, customization: preset.customization }),
    [preset],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      className={cn(
        "group relative text-left rounded-lg border bg-bg overflow-hidden transition-all duration-200",
        isPremium
          ? "border-2 border-amber-400 ring-1 ring-amber-200/70 shadow-[0_6px_20px_-6px_rgba(217,158,21,0.55)] hover:border-amber-500 hover:ring-2 hover:ring-amber-300/80 hover:shadow-[0_10px_28px_-6px_rgba(217,158,21,0.7)]"
          : "border-line hover:border-brand/50 hover:ring-2 hover:ring-brand/30",
      )}
    >
      <div className="relative pointer-events-none">
        <ResumePreview singlePage resume={resume} />

        {isPremium && (
          <>
            <span className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-400 via-yellow-300 to-amber-400" />
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-md ring-2 ring-white">
              <Crown size={12} strokeWidth={2.5} />
              {t("marketplace.premiumBadge")}
            </span>

            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100 group-hover:backdrop-blur-[1px]">
                <span className="flex scale-90 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-amber-900 opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                  <Crown
                    size={12}
                    strokeWidth={2.5}
                    className="text-amber-500"
                  />
                  {t("marketplace.premiumHover")}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-text">
          {t(
            `marketplace.aiResult.layout${preset.layout === "classic" ? "Classic" : "Sidebar"}`,
          )}
        </p>
        <p className="text-xs text-text-secondary">
          {t(`marketplace.industries.${preset.industry}`)}
        </p>
      </div>
    </button>
  );
}
