import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import PremiumLockOverlay from "../../components/resume/PremiumLockOverlay";
import ResumePreview from "../../components/resume/ResumePreview";
import { demoResumeForPreset } from "../../data/demoResume";
import type { TemplatePreset } from "../../data/templates";
import {
  canClaimTemplateSlot,
  hasTemplateAccess,
} from "../../lib/templateAccess";
import { useEntitlementStore } from "../../store/entitlementStore";

export default function TemplateCard({
  preset,
  onSelect,
}: {
  preset: TemplatePreset;
  onSelect: (preset: TemplatePreset) => void;
}) {
  const { t } = useTranslation();
  const isPremium = preset.tier === "premium";
  const unlockedIds = useEntitlementStore((s) => s.unlockedTemplateIds);
  const templateSlots = useEntitlementStore((s) => s.templateSlots);
  const ownedIds = useEntitlementStore((s) => s.ownedTemplateIds);
  const hasAccess = hasTemplateAccess(
    preset.id,
    unlockedIds,
    templateSlots,
    ownedIds,
  );
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

        {isPremium && !hasAccess && <PremiumLockOverlay canClaim={canClaim} />}

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
