import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ResumePreview from "../../components/resume/ResumePreview";
import { demoResumeForPreset } from "../../data/demoResume";
import type { TemplatePreset } from "../../data/templates";
import { usePacks } from "../../hooks/usePacks";
import { canClaimTemplateSlot, hasTemplateAccess } from "../../lib/templateAccess";
import { useEntitlementStore } from "../../store/entitlementStore";

export default function TemplateCard({
  preset,
  onSelect,
}: {
  preset: TemplatePreset;
  onSelect: (preset: TemplatePreset) => void;
}) {
  const { t } = useTranslation();
  const { design } = usePacks();
  const isPremium = preset.tier === "premium";
  const unlockedIds = useEntitlementStore((s) => s.unlockedTemplateIds);
  const templateSlots = useEntitlementStore((s) => s.templateSlots);
  const hasAccess = hasTemplateAccess(preset.id, unlockedIds, templateSlots);
  const canClaim = canClaimTemplateSlot(templateSlots, unlockedIds.length);
  const resume = useMemo(
    () => demoResumeForPreset(preset.customization),
    [preset],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      className="group relative text-left rounded-lg border border-line bg-bg overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg hover:ring-2 hover:ring-brand/20"
    >
      <div className="relative pointer-events-none">
        <ResumePreview singlePage resume={resume} />

        {isPremium && !hasAccess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-5 flex max-w-[85%] flex-col items-center gap-2.5 rounded-2xl bg-white/60 px-5 py-5 text-center shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)] ring-1 ring-black/6 backdrop-blur-lg backdrop-saturate-150 transition-transform duration-200 group-hover:scale-[1.04]">
              <span className="text-sm leading-snug font-bold uppercase tracking-wide text-brand-dark">
                {t("marketplace.premiumOverlay.title")}
              </span>
              <span className="rounded-full bg-linear-to-r from-brand to-brand-secondary px-5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-brand/30">
                {canClaim
                  ? t("marketplace.premiumOverlay.claim")
                  : t("marketplace.premiumOverlay.unlockFor", {
                      price: design.price,
                    })}
              </span>
            </div>
          </div>
        )}

        {isPremium && hasAccess && (
          <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-dark shadow-sm ring-1 ring-black/6">
            {t("marketplace.premiumBadge")}
          </span>
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
