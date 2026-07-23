import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import ResumePreview from "../../components/resume/ResumePreview";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { DEMO_RESUME } from "../../data/demoResume";
import { FONT_FAMILIES } from "../../lib/fonts";
import { cn } from "../../lib/utils";
import {
  ACCENT_COLOR_KEYS,
  ACCENT_COLOR_SWATCHES,
  type AiAnswers,
  type AiRecommendation,
  type TemplateLayout,
  type TemplatePreset,
} from "../../data/templates";
import type { Customization, Resume } from "../../types/resume";

export default function AiDesignResult({
  recommendation,
  answers,
  onChangeAnswers,
  onContinue,
}: {
  recommendation: AiRecommendation;
  answers: AiAnswers;
  onChangeAnswers: () => void;
  onContinue: (
    preset: TemplatePreset,
    customization: Partial<Customization>,
  ) => void;
}) {
  const { t } = useTranslation();
  const [activeLayout, setActiveLayout] = useState<TemplateLayout>(
    recommendation.primary.layout,
  );
  const [accentColor, setAccentColor] = useState(
    recommendation.primary.customization.accentColor,
  );
  const [fontFamily, setFontFamily] = useState(
    recommendation.primary.customization.fontFamily,
  );

  const activePreset =
    activeLayout === recommendation.primary.layout
      ? recommendation.primary
      : recommendation.sibling;

  const previewFor = (preset: TemplatePreset) => ({
    ...DEMO_RESUME,
    customization: { ...preset.customization, accentColor, fontFamily },
  });

  const colorKey = ACCENT_COLOR_KEYS[accentColor];
  const colorName = colorKey ? t(`marketplace.colorNames.${colorKey}`) : "";
  const industryLabel = t(`marketplace.industries.${activePreset.industry}`);
  const vibeLabels = answers.vibe.map((v) =>
    t(`marketplace.aiPicker.vibeOptions.${v}`),
  );
  const vibeLabel = vibeLabels.join(", ");
  const layoutLabel = t(
    `marketplace.aiResult.layout${activeLayout === "classic" ? "Classic" : "Sidebar"}`,
  );

  const primaryPreview = useMemo(
    () => previewFor(recommendation.primary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recommendation.primary, accentColor, fontFamily],
  );
  const siblingPreview = useMemo(
    () => previewFor(recommendation.sibling),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recommendation.sibling, accentColor, fontFamily],
  );

  const handleContinue = () =>
    onContinue(activePreset, {
      ...activePreset.customization,
      accentColor,
      fontFamily,
    });

  return (
    <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-8 items-start">
      {/* ---------- left: spec panel ---------- */}
      <div className="space-y-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-brand">
            <Sparkles size={13} strokeWidth={2.5} />
            {t("marketplace.aiResult.eyebrow")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mt-2">
            {t("marketplace.aiResult.title")}{" "}
            <span className="text-brand italic">
              {t("marketplace.aiResult.titleAccent")}
            </span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {t("marketplace.aiResult.description", {
              layout: layoutLabel,
              color: colorName,
              vibe: vibeLabel,
              industry: industryLabel,
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AnswerBadge
            label={t(`marketplace.aiPicker.industryOptions.${answers.industry}`)}
          />
          <AnswerBadge
            label={t(
              `marketplace.aiPicker.experienceOptions.${answers.experience}`,
            )}
          />
          {vibeLabels.map((label) => (
            <AnswerBadge key={label} label={label} />
          ))}
        </div>

        <div className="rounded-xl border border-line p-4 space-y-3">
          <p className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
            {t("marketplace.aiResult.specTitle")}
          </p>
          <SpecRow label={t("marketplace.aiResult.specLayout")} value={layoutLabel} />
          <SpecRow
            label={t("marketplace.aiResult.specColor")}
            value={
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border border-black/10"
                  style={{ backgroundColor: accentColor }}
                />
                {colorName}
              </span>
            }
          />
          <SpecRow label={t("marketplace.aiResult.specFont")} value={fontFamily} />
          <SpecRow
            label={t("marketplace.aiResult.specStyle")}
            value={t(`marketplace.styleNames.${activePreset.styleKey}`)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
              {t("marketplace.aiResult.accentColorLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLOR_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setAccentColor(hex)}
                  aria-label={t(`marketplace.colorNames.${ACCENT_COLOR_KEYS[hex]}`)}
                  className={cn(
                    "size-6 shrink-0 rounded-full border transition-transform hover:scale-110",
                    accentColor.toLowerCase() === hex.toLowerCase()
                      ? "border-transparent ring-2 ring-offset-2 ring-offset-bg"
                      : "border-line",
                  )}
                  style={{
                    backgroundColor: hex,
                    ...(accentColor.toLowerCase() === hex.toLowerCase()
                      ? ({ "--tw-ring-color": hex } as React.CSSProperties)
                      : {}),
                  }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
              {t("marketplace.aiResult.typefaceLabel")}
            </p>
            <Select
              value={fontFamily}
              onValueChange={(v) => setFontFamily(v ?? fontFamily)}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg bg-surface-2 px-4 py-3 text-xs text-text-secondary">
          {t("marketplace.aiResult.note")}
        </div>
      </div>

      {/* ---------- right: layout comparison ---------- */}
      <div>
        <p className="rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-center text-sm font-medium text-brand">
          {t("marketplace.aiResult.switchHint")}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-6">
          <ResultPreviewCard
            resume={primaryPreview}
            selected={activeLayout === recommendation.primary.layout}
            label={t(
              `marketplace.aiResult.layout${recommendation.primary.layout === "classic" ? "Classic" : "Sidebar"}`,
            )}
            onClick={() => setActiveLayout(recommendation.primary.layout)}
          />
          <ResultPreviewCard
            resume={siblingPreview}
            selected={activeLayout === recommendation.sibling.layout}
            label={t(
              `marketplace.aiResult.layout${recommendation.sibling.layout === "classic" ? "Classic" : "Sidebar"}`,
            )}
            onClick={() => setActiveLayout(recommendation.sibling.layout)}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button size="compact" variant="outline" onClick={onChangeAnswers}>
            {t("marketplace.aiResult.changeAnswers")}
          </Button>
          <Button size="compact" onClick={handleContinue}>
            {t("marketplace.aiResult.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnswerBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-medium text-text-secondary">
      {label}
    </span>
  );
}

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

function ResultPreviewCard({
  resume,
  selected,
  label,
  onClick,
}: {
  resume: Resume;
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border-2 overflow-hidden transition-colors",
        selected ? "border-brand" : "border-line hover:border-brand/40",
      )}
    >
      <div className="pointer-events-none">
        <ResumePreview singlePage resume={resume} />
      </div>
      <p
        className={cn(
          "px-2 py-2 text-center text-sm font-medium",
          selected ? "text-brand" : "text-text-secondary",
        )}
      >
        {label}
      </p>
    </button>
  );
}
