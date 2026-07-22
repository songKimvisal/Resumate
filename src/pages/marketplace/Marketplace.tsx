import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bot, Check, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { useResumeStore } from "../../store/resumeStore";
import { useEntitlementStore } from "../../store/entitlementStore";
import {
  INDUSTRIES,
  TEMPLATE_PRESETS,
  recommendTemplates,
  type AiAnswers,
  type AiRecommendation,
  type TemplateIndustry,
  type TemplatePreset,
  type TemplateTier,
} from "../../data/templates";
import type { Customization } from "../../types/resume";
import { cn } from "../../lib/utils";
import AiDesignModal from "./AiDesignModal";
import AiDesignResult from "./AiDesignResult";
import TemplateCard from "./TemplateCard";
import UnlockTemplateModal from "./UnlockTemplateModal";

const PAGE_SIZE = 8;
const TIER_TABS: (TemplateTier | "all")[] = ["all", "free", "premium"];

export default function Marketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const updateCustomization = useResumeStore((s) => s.updateCustomization);
  const isUnlocked = useEntitlementStore((s) => s.isUnlocked);
  const unlockTemplate = useEntitlementStore((s) => s.unlockTemplate);

  const [pendingUnlock, setPendingUnlock] = useState<{
    preset: TemplatePreset;
    customization: Partial<Customization>;
  } | null>(null);

  const [tierFilter, setTierFilter] = useState<TemplateTier | "all">("all");
  const [industryFilter, setIndustryFilter] = useState<TemplateIndustry[]>([]);
  const [page, setPage] = useState(1);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  // bumped every time the modal opens, so it remounts fresh from
  // `aiAnswers` instead of needing an effect to reset its fields
  const [aiModalKey, setAiModalKey] = useState(0);
  const openAiModal = () => {
    setAiModalKey((k) => k + 1);
    setAiModalOpen(true);
  };
  const [aiAnswers, setAiAnswers] = useState<AiAnswers | null>(null);
  const [recommendation, setRecommendation] =
    useState<AiRecommendation | null>(null);
  const [screen, setScreen] = useState<"gallery" | "aiResult">("gallery");

  const filtered = useMemo(
    () =>
      TEMPLATE_PRESETS.filter(
        (p) =>
          (tierFilter === "all" || p.tier === tierFilter) &&
          (industryFilter.length === 0 || industryFilter.includes(p.industry)),
      ),
    [tierFilter, industryFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setTierFilterAndResetPage = (tier: TemplateTier | "all") => {
    setTierFilter(tier);
    setPage(1);
  };

  const toggleIndustry = (industry: TemplateIndustry) => {
    setIndustryFilter((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry],
    );
    setPage(1);
  };

  const clearIndustryFilter = () => {
    setIndustryFilter([]);
    setPage(1);
  };

  const requestApply = (
    preset: TemplatePreset,
    customization: Partial<Customization>,
  ) => {
    if (preset.tier === "premium" && !isUnlocked(preset.id)) {
      setPendingUnlock({ preset, customization });
      return;
    }
    updateCustomization(customization);
    navigate("/builder");
  };

  const applyTemplate = (preset: TemplatePreset) =>
    requestApply(preset, preset.customization);

  const confirmUnlock = () => {
    if (!pendingUnlock) return;
    unlockTemplate(pendingUnlock.preset.id);
    updateCustomization(pendingUnlock.customization);
    navigate("/builder");
    setPendingUnlock(null);
  };

  const handleGenerate = (answers: AiAnswers) => {
    setAiAnswers(answers);
    setRecommendation(recommendTemplates(answers));
    setAiModalOpen(false);
    setScreen("aiResult");
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {screen === "gallery" ? (
          <>
            <h1 className="text-3xl font-bold text-text">
              {t("marketplace.hero.title")}{" "}
              <span className="text-brand italic">
                {t("marketplace.hero.titleAccent")}
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              {t("marketplace.hero.subtitle")}
            </p>

            {/* ---------- AI pick banner ---------- */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/5 p-5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 size-10 rounded-full bg-brand text-white inline-flex items-center justify-center">
                  <Bot size={18} strokeWidth={2} />
                </span>
                <div>
                  <p className="font-semibold text-text">
                    {t("marketplace.aiBanner.title")}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {t("marketplace.aiBanner.subtitle")}
                  </p>
                </div>
              </div>
              <Button size="compact" className="shrink-0" onClick={openAiModal}>
                {t("marketplace.aiBanner.cta")}
              </Button>
            </div>

            {/* ---------- filters ---------- */}
            <div className="mt-6 flex items-center gap-2">
              {TIER_TABS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilterAndResetPage(tier)}
                  className={cn(
                    "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors",
                    tierFilter === tier
                      ? "border-brand bg-brand text-white"
                      : "border-line text-text-secondary hover:bg-surface-2 hover:text-text",
                  )}
                >
                  {t(`marketplace.filters.${tier}`)}
                </button>
              ))}

              <Popover>
                <PopoverTrigger
                  aria-label={t("marketplace.filters.industryLabel")}
                  title={t("marketplace.filters.industryLabel")}
                  className={cn(
                    "size-9 rounded-full border-2 inline-flex items-center justify-center transition-colors",
                    industryFilter.length > 0
                      ? "border-brand text-brand"
                      : "border-line text-text-secondary hover:bg-surface-2 hover:text-text",
                  )}
                >
                  <Filter size={15} strokeWidth={2} />
                </PopoverTrigger>
                <PopoverContent className="w-52 p-2" align="start">
                  <p className="px-2 py-1.5 text-xs font-semibold tracking-wide uppercase text-text-secondary">
                    {t("marketplace.filters.industryLabel")}
                  </p>
                  {INDUSTRIES.map((industry) => {
                    const selected = industryFilter.includes(industry);
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => toggleIndustry(industry)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-left transition-colors",
                          selected
                            ? "bg-brand/5 text-brand font-medium"
                            : "text-text hover:bg-surface-2",
                        )}
                      >
                        <Check
                          size={13}
                          strokeWidth={3}
                          className={selected ? "opacity-100" : "opacity-0"}
                        />
                        {t(`marketplace.industries.${industry}`)}
                      </button>
                    );
                  })}
                  {industryFilter.length > 0 && (
                    <button
                      type="button"
                      onClick={clearIndustryFilter}
                      className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-surface-2 hover:text-text transition-colors"
                    >
                      {t("marketplace.filters.clearIndustry")}
                    </button>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* ---------- grid ---------- */}
            {pageItems.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {pageItems.map((preset) => (
                  <TemplateCard
                    key={preset.id}
                    preset={preset}
                    onSelect={applyTemplate}
                  />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-text-secondary">
                {t("marketplace.empty")}
              </p>
            )}

            {/* ---------- pagination ---------- */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={t("marketplace.pagination.prev")}
                  className="size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "size-8 rounded-full text-sm font-medium transition-colors",
                        n === page
                          ? "bg-brand text-white"
                          : "text-text-secondary hover:bg-surface-2 hover:text-text",
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label={t("marketplace.pagination.next")}
                  className="size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          recommendation &&
          aiAnswers && (
            <AiDesignResult
              key={`${recommendation.primary.id}-${recommendation.sibling.id}`}
              recommendation={recommendation}
              answers={aiAnswers}
              onChangeAnswers={openAiModal}
              onContinue={requestApply}
            />
          )
        )}
      </div>

      <AiDesignModal
        key={aiModalKey}
        open={aiModalOpen}
        initialAnswers={aiAnswers}
        onCancel={() => setAiModalOpen(false)}
        onGenerate={handleGenerate}
      />

      <UnlockTemplateModal
        open={pendingUnlock !== null}
        preset={pendingUnlock?.preset ?? null}
        onCancel={() => setPendingUnlock(null)}
        onUnlock={confirmUnlock}
      />
    </div>
  );
}
