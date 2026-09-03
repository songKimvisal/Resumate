import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import ResumePreview from "../../components/resume/ResumePreview";
import ResumePreviewOverlay from "../../components/resume/ResumePreviewOverlay";
import { demoResumeForPreset } from "../../data/demoResume";
import type { TemplatePreset } from "../../data/templates";
import { NeedTabs, PackCard, PackCarousel } from "../../components/home/PackPicker";
import { usePacks } from "../../hooks/usePacks";
import { setPendingTemplateId } from "../../lib/session";
import { canClaimTemplateSlot, PREMIUM_TEMPLATE_PRICE } from "../../lib/templateAccess";
import { useEntitlementStore } from "../../store/entitlementStore";
import type { NeedId, PackId } from "../../types/billing";

const UNLOCK_NEEDS: NeedId[] = ["design", "both"];

export default function UnlockTemplateModal({
  open,
  preset,
  onCancel,
  onUnlock,
  asNewResume = true,
}: {
  open: boolean;
  preset: TemplatePreset | null;
  onCancel: () => void;
  onUnlock: () => void | Promise<void>;
  /** Whether paying for this template (pack checkout or direct buy) should
   * land on a fresh resume or restyle whatever resume is already open.
   * Default true (browsing the marketplace for a new resume); pass false
   * when unlocking the template already applied to a resume in progress. */
  asNewResume?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { byNeed } = usePacks();
  const unlockedCount = useEntitlementStore((s) => s.unlockedTemplateIds.length);
  const templateSlots = useEntitlementStore((s) => s.templateSlots);
  const canClaim = canClaimTemplateSlot(templateSlots, unlockedCount);
  const [need, setNeed] = useState<NeedId>("design");
  const [previewOpen, setPreviewOpen] = useState(false);
  const packs = byNeed.both;
  const popularBadge = t("home.pricing.bestValue");
  const premiumTemplateTier = (
    t("home.pricing.design.tiers", { returnObjects: true }) as {
      name: string;
      price: string;
      period: string;
      features: string[];
    }[]
  )[1];

  const previewResume = useMemo(
    () => (preset ? demoResumeForPreset(preset.customization) : null),
    [preset],
  );

  useEffect(() => {
    if (open) {
      setNeed("design");
      setPreviewOpen(false);
    }
  }, [open, preset?.id]);

  const checkout = (packId: PackId) => {
    if (!preset) return;
    setPendingTemplateId(preset.id, asNewResume);
    onCancel();
    navigate("/billing/payment", { state: { pack: packId } });
  };

  const buyDirect = () => {
    if (!preset) return;
    setPendingTemplateId(preset.id, asNewResume);
    onCancel();
    navigate("/billing/payment", { state: { flat: "premium-template" } });
  };

  const styleName = preset
    ? t(`marketplace.styleNames.${preset.styleKey}`)
    : "";

  return (
    <AnimatePresence>
      {open && preset && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <div className="flex min-h-dvh items-start justify-center p-3 sm:items-center sm:p-6">
            <motion.div
              className="relative my-3 w-full max-w-6xl rounded-2xl bg-bg px-4 py-5 shadow-xl sm:my-auto sm:px-6 sm:py-7 lg:px-8 lg:py-8"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onCancel}
                aria-label={t("marketplace.unlockModal.cancel")}
                className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text sm:right-4 sm:top-4"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <div className="grid items-start gap-5 lg:grid-cols-[20.5rem_minmax(0,1fr)] lg:gap-7">
                <aside className="flex flex-col items-center lg:items-stretch">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    aria-label={t("marketplace.unlockModal.viewFull")}
                    className="group w-44 text-left sm:w-52 lg:w-full"
                  >
                    <span className="block rounded-2xl bg-surface-2 p-1 shadow-inner ring-1 ring-line">
                      <span className="relative block overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
                        {previewResume && (
                          <ResumePreview
                            singlePage
                            resume={previewResume}
                          />
                        )}
                        <span className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white opacity-100 shadow-sm transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                          <Maximize2 size={13} strokeWidth={2.5} />
                        </span>
                      </span>
                    </span>
                    <span className="mt-2.5 block text-center text-xs font-semibold text-text">
                      {styleName}
                    </span>
                    <span className="mt-0.5 block text-center text-[11px] text-text-secondary">
                      {t(
                        `marketplace.aiResult.layout${preset.layout === "classic" ? "Classic" : "Sidebar"}`,
                      )}
                    </span>
                    <span className="mt-0.5 block text-center text-[11px] text-text-secondary/80 lg:hidden">
                      {t("marketplace.unlockModal.viewFull")}
                    </span>
                  </button>
                </aside>

                <div className="min-w-0 text-center lg:text-left">
                  <h2 className="px-8 text-xl font-bold tracking-tight text-text lg:px-0 lg:pr-10 lg:text-2xl">
                    {t("marketplace.unlockModal.title", { style: styleName })}
                  </h2>
                  <p className="mt-1.5 text-sm text-text-secondary">
                    {t(
                      canClaim
                        ? "marketplace.unlockModal.claimDescription"
                        : "marketplace.unlockModal.description",
                    )}
                  </p>

                  {canClaim ? (
                    <div className="mx-auto mt-6 max-w-sm lg:mx-0">
                      <Button
                        className="h-9 w-full"
                        size="compact"
                        onClick={onUnlock}
                      >
                        {t("marketplace.unlockModal.claimCta")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-5">
                        <NeedTabs
                          value={need}
                          onChange={setNeed}
                          label={t("marketplace.unlockModal.chooseLabel")}
                          ids={UNLOCK_NEEDS}
                          align="start"
                          className="w-full lg:max-w-104"
                        />
                        <p className="mt-2.5 text-sm text-text-secondary">
                          {t(`home.pricing.${need}.label`)}
                        </p>
                      </div>

                      <AnimatePresence mode="wait">
                        {need === "design" ? (
                          <motion.div
                            key="design"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mx-auto mt-5 w-full max-w-sm lg:mx-0"
                          >
                            <PackCard
                              pack={{
                                ...premiumTemplateTier,
                                cta: t("marketplace.unlockModal.buyTemplateCta", {
                                  price: PREMIUM_TEMPLATE_PRICE,
                                }),
                              }}
                              compact
                              onSelect={buyDirect}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="both"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mt-5 min-w-0"
                          >
                            <PackCarousel
                              packs={packs}
                              popularBadge={popularBadge}
                              onSelect={(i) => checkout(packs[i].id)}
                              contained
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      {previewResume && (
      <ResumePreviewOverlay
        resume={previewResume}
        open={open && previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeLabel={t("marketplace.unlockModal.cancel")}
      />
      )}
    </AnimatePresence>
  );
}
