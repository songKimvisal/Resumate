import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Check,
  Crown,
  Globe,
  GripVertical,
  Lock,
  Minus,
  Pipette,
  Plus,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useResumeStore } from "../../store/resumeStore";
import { useEntitlementStore } from "../../store/entitlementStore";
import type {
  Customization,
  CustomizationToggles,
  SectionOrderKey,
} from "../../types/resume";
import { Switch } from "../../components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { TEMPLATE_PRESETS, type TemplatePreset, designWithoutHeadingLanguage } from "../../data/templates";
import { FONT_FAMILIES } from "../../lib/fonts";
import { idealTextColor, hexToRgb, rgbToHex } from "../../lib/color";
import { partitionSectionOrder } from "../../lib/sectionOrder";
import { hasTemplateAccess, hasDesignAccess } from "../../lib/templateAccess";
import { unlockPremiumTemplate } from "../../lib/api/templates";
import { usePacks } from "../../hooks/usePacks";
import { cn, useFieldId } from "../../lib/utils";
import {
  isSpecialLayoutVariant,
  usesPhotoControls,
  usesPhotoSlot,
  usesSidebarBg,
} from "../../components/resume/layouts/shared";
import UnlockTemplateModal from "../marketplace/UnlockTemplateModal";
import ResumePreview from "../../components/resume/ResumePreview";
import { demoResumeForPreset } from "../../data/demoResume";
import { ResumeLanguageToggle } from "./ResumeLanguageToggle";

const ACCENT_COLORS = [
  "#C1121F",
  "#EA580C",
  "#D97706",
  "#65A30D",
  "#0F766E",
  "#0891B2",
  "#1D4ED8",
  "#7C3AED",
  "#DB2777",
  "#374151",
];
const TEXT_COLOR_PRESETS = [
  { labelKey: "textInk", value: "#171717" },
  { labelKey: "textSlate", value: "#475569" },
  { labelKey: "textNavy", value: "#1E293B" },
];
const BACKGROUND_COLOR_PRESETS = [
  { labelKey: "bgWhite", value: "#ffffff" },
  { labelKey: "bgWarm", value: "#FAF6F0" },
  { labelKey: "bgCool", value: "#F4F6F9" },
];
type SectionKey =
  | "layout"
  | "header"
  | "font"
  | "fontSize"
  | "sectionHeadings"
  | "colors"
  | "spacing";

const SECTION_CARD =
  "rounded-xl border border-line bg-bg p-4 sm:p-5 md:p-6 space-y-6 scroll-mt-16 md:scroll-mt-4";
const SECTION_TITLE = "text-sm font-semibold text-brand";
const COLOR_LABEL =
  "text-xs font-semibold tracking-wide text-text-secondary uppercase";
type HeadingPreset = Pick<Customization, "headingBorder"> & {
  headingsLine: boolean;
};

const HEADING_PRESETS: HeadingPreset[] = [
  { headingBorder: "none", headingsLine: true },
  { headingBorder: "none", headingsLine: false },
  { headingBorder: "outline", headingsLine: false },
  { headingBorder: "filled", headingsLine: false },
  { headingBorder: "line", headingsLine: false },
  { headingBorder: "underline", headingsLine: false },
];

const HEADING_BORDER_LABEL_KEY: Record<Customization["headingBorder"], string> =
  {
    none: "borderNone",
    outline: "borderOutline",
    filled: "borderFilled",
    line: "borderLine",
    underline: "borderUnderline",
  };

const SECTION_ICON_OPTIONS: Customization["sectionIcon"][] = [
  "none",
  "outline",
  "filled",
];

const SECTION_ICON_LABEL_KEY: Record<Customization["sectionIcon"], string> = {
  none: "sectionIconNone",
  outline: "sectionIconOutline",
  filled: "sectionIconFilled",
};

const BULLET_STYLE_OPTIONS: Customization["bulletStyle"][] = [
  "disc",
  "dash",
  "arrow",
  "square",
  "none",
];

const BULLET_STYLE_LABEL_KEY: Record<Customization["bulletStyle"], string> = {
  disc: "bulletDisc",
  dash: "bulletDash",
  arrow: "bulletArrow",
  square: "bulletSquare",
  none: "bulletNone",
};

const BULLET_STYLE_GLYPH: Record<Customization["bulletStyle"], string> = {
  disc: "•",
  dash: "–",
  arrow: "→",
  square: "▪",
  none: "",
};

const DATE_FORMAT_OPTIONS: Customization["dateFormat"][] = [
  "monthYear",
  "numeric",
  "yearOnly",
];

const DATE_FORMAT_LABEL_KEY: Record<Customization["dateFormat"], string> = {
  monthYear: "dateFormatMonthYear",
  numeric: "dateFormatNumeric",
  yearOnly: "dateFormatYearOnly",
};

const CONTACT_SEPARATOR_OPTIONS: Customization["contactSeparator"][] = [
  "icon",
  "bullet",
  "bar",
];

const CONTACT_SEPARATOR_LABEL_KEY: Record<
  Customization["contactSeparator"],
  string
> = {
  icon: "separatorIcon",
  bullet: "separatorBullet",
  bar: "separatorBar",
};

const ICON_STYLES: Customization["iconStyle"][] = [
  "plain",
  "filled",
  "outline",
  "square",
  "faded",
];

const ICON_STYLE_LABEL_KEY: Record<Customization["iconStyle"], string> = {
  plain: "iconPlain",
  filled: "iconFilled",
  outline: "iconOutline",
  square: "iconSquare",
  faded: "iconFaded",
};

export default function CustomizePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { design } = usePacks();
  const customization = useResumeStore((s) => s.resume.customization);
  const updateCustomization = useResumeStore((s) => s.updateCustomization);
  const isSpecialLayout = isSpecialLayoutVariant(customization.layoutVariant);
  const showSidebarColor =
    customization.columns === "two" ||
    usesSidebarBg(customization.layoutVariant);
  const showPhotoToggle =
    !isSpecialLayout || usesPhotoSlot(customization.layoutVariant);
  const showPhotoStyleControls =
    !isSpecialLayout || usesPhotoControls(customization.layoutVariant);

  // a premium template applied from the marketplace/AI picker leaves its
  // preset id in customization.template; while it's not unlocked, Customize
  // stays locked so a free user can't dial a free template to match it.
  // a pack that includes templates also unlocks colors/fonts/layout on free
  // templates - they already paid for design control
  const activeTemplatePreset = TEMPLATE_PRESETS.find(
    (p) => p.id === customization.template,
  );
  const templateSlots = useEntitlementStore((s) => s.templateSlots);
  const unlockedTemplateIds = useEntitlementStore((s) => s.unlockedTemplateIds);
  const hasActiveTemplateAccess =
    !activeTemplatePreset ||
    activeTemplatePreset.tier !== "premium" ||
    hasTemplateAccess(
      activeTemplatePreset.id,
      unlockedTemplateIds,
      templateSlots,
    );
  const isLocked =
    activeTemplatePreset?.tier === "premium" && !hasActiveTemplateAccess;
  const hasFullCustomizationAccess =
    hasActiveTemplateAccess && hasDesignAccess(templateSlots);
  const isPresetUnlocked = (id: string) =>
    hasTemplateAccess(id, unlockedTemplateIds, templateSlots);
  const [unlockTarget, setUnlockTarget] = useState<TemplatePreset | null>(
    null,
  );
  // CTA for any premium-gated control: unlock the active template if it's
  // premium and not yet owned, otherwise send them to subscribe
  const openUpgrade = () => {
    if (activeTemplatePreset?.tier === "premium" && !hasActiveTemplateAccess) {
      setUnlockTarget(activeTemplatePreset);
    } else {
      navigate("/billing");
    }
  };

  // suggestions for the inline template switcher: same-industry templates
  // first (closest match to what's already applied), then the rest, minus
  // whatever is currently active
  const templateSuggestions = useMemo(() => {
    const others = TEMPLATE_PRESETS.filter(
      (p) => p.id !== customization.template,
    );
    if (!activeTemplatePreset) return others.slice(0, 3);
    const sameIndustry = others.filter(
      (p) => p.industry === activeTemplatePreset.industry,
    );
    const rest = others.filter(
      (p) => p.industry !== activeTemplatePreset.industry,
    );
    return [...sameIndustry, ...rest].slice(0, 3);
  }, [customization.template, activeTemplatePreset]);

  const selectTemplate = (preset: TemplatePreset) => {
    if (preset.tier === "premium" && !isPresetUnlocked(preset.id)) {
      setUnlockTarget(preset);
      return;
    }
    updateCustomization(designWithoutHeadingLanguage(preset.customization));
  };

  const experience = useResumeStore((s) => s.resume.experience);
  const noExperience = useResumeStore((s) => s.resume.noExperience);
  const education = useResumeStore((s) => s.resume.education);
  const skills = useResumeStore((s) => s.resume.skills);
  const languages = useResumeStore((s) => s.resume.languages);
  const references = useResumeStore((s) => s.resume.references);
  const includeReferences = useResumeStore((s) => s.resume.includeReferences);
  const sectionHasContent: Record<SectionOrderKey, boolean> = {
    experience:
      experience.length > 0 || noExperience.length > 0 || education.length > 0,
    skills: skills.length > 0,
    language: languages.length > 0,
    references: includeReferences && references.length > 0,
  };

  const patchToggle = (key: keyof CustomizationToggles) =>
    updateCustomization({
      toggles: { ...customization.toggles, [key]: !customization.toggles[key] },
    });

  const toggleLinkStyle = (option: Customization["linkStyle"][number]) =>
    updateCustomization({
      linkStyle: customization.linkStyle.includes(option)
        ? customization.linkStyle.filter((o) => o !== option)
        : [...customization.linkStyle, option],
    });

  // ---- section layout drag-and-drop ----
  const [dragSectionKey, setDragSectionKey] = useState<SectionOrderKey | null>(
    null,
  );
  const moveSectionOrder = (
    dragKey: SectionOrderKey,
    overKey: SectionOrderKey,
  ) => {
    if (dragKey === overKey) return;
    const order = [...customization.sectionOrder];
    const from = order.indexOf(dragKey);
    const to = order.indexOf(overKey);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, dragKey);
    updateCustomization({ sectionOrder: order });
  };
  const sidebarKeys = customization.sidebarKeys ?? [];

  const assignSectionColumn = (dragKey: SectionOrderKey, toSidebar: boolean) =>
    toSidebar
      ? sidebarKeys.includes(dragKey)
        ? sidebarKeys
        : [...sidebarKeys, dragKey]
      : sidebarKeys.filter((k) => k !== dragKey);

  const dropSectionOnRow = (
    dragKey: SectionOrderKey,
    overKey: SectionOrderKey,
  ) => {
    if (dragKey === overKey) return;
    const order = [...customization.sectionOrder];
    const from = order.indexOf(dragKey);
    const to = order.indexOf(overKey);
    if (from !== -1 && to !== -1) {
      order.splice(from, 1);
      order.splice(to, 0, dragKey);
    }
    updateCustomization({
      sectionOrder: order,
      sidebarKeys: assignSectionColumn(dragKey, sidebarKeys.includes(overKey)),
    });
  };
  const dropSectionInColumn = (
    dragKey: SectionOrderKey,
    toSidebar: boolean,
  ) => {
    const order = customization.sectionOrder.filter((k) => k !== dragKey);
    order.push(dragKey);
    updateCustomization({
      sectionOrder: order,
      sidebarKeys: assignSectionColumn(dragKey, toSidebar),
    });
  };

  // ---- section nav + scroll spy ----
  const layoutRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const sectionHeadingsRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const spacingRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<
    SectionKey,
    React.RefObject<HTMLDivElement | null>
  > = {
    layout: layoutRef,
    header: headerRef,
    font: fontRef,
    fontSize: fontSizeRef,
    sectionHeadings: sectionHeadingsRef,
    colors: colorsRef,
    spacing: spacingRef,
  };

  const [activeSection, setActiveSection] = useState<SectionKey>("layout");

  useEffect(() => {
    const first = Object.values(sectionRefs).find((ref) => ref.current)?.current;
    const root =
      first?.closest("[data-builder-form-pane]") ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target.getAttribute("data-section");
        if (top) setActiveSection(top as SectionKey);
      },
      { root, rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (key: SectionKey) => {
    setActiveSection(key);
    sectionRefs[key].current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const navItems: { key: SectionKey; label: string }[] = [
    { key: "colors", label: t("builder.customizePage.nav.colors") },
    { key: "font", label: t("builder.customizePage.nav.font") },
    { key: "fontSize", label: t("builder.customizePage.nav.fontSize") },
    { key: "layout", label: t("builder.customizePage.nav.layout") },
    ...(!isSpecialLayout
      ? [{ key: "header" as const, label: t("builder.customizePage.nav.header") }]
      : []),
    {
      key: "sectionHeadings",
      label: t("builder.customizePage.nav.sectionHeadings"),
    },
    { key: "spacing", label: t("builder.customizePage.nav.spacing") },
  ];

  const { main: mainSectionKeys, sidebar: sidebarSectionKeys } =
    partitionSectionOrder(
      customization.sectionOrder,
      customization.sidebarKeys,
    );
  const headerIsBanner =
    !isSpecialLayout &&
    (customization.columns === "one" ||
      customization.headerPosition === "top");

  const activeHeadingPreset = HEADING_PRESETS.findIndex(
    (p) =>
      p.headingBorder === customization.headingBorder &&
      p.headingsLine === customization.toggles.headingsLine,
  );
  const applyHeadingPreset = (i: number) => {
    const preset = HEADING_PRESETS[i];
    updateCustomization({
      headingBorder: preset.headingBorder,
      toggles: { ...customization.toggles, headingsLine: preset.headingsLine },
    });
  };

  if (isLocked && activeTemplatePreset) {
    const lockedPreviewResume = demoResumeForPreset(
      activeTemplatePreset.customization,
    );
    return (
      <div>
        <div>
          <h2 className="text-2xl font-bold">
            {t("builder.customizePage.title")}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {t("builder.customizePage.subtitle")}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-line bg-bg p-6 sm:p-8 text-center">
          <div className="relative w-full max-w-xs overflow-hidden rounded-lg shadow-sm">
            <div className="pointer-events-none">
              <ResumePreview singlePage resume={lockedPreviewResume} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="mx-5 flex max-w-[85%] flex-col items-center gap-2.5 rounded-2xl bg-white/60 px-5 py-5 text-center shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)] ring-1 ring-black/6 backdrop-blur-lg backdrop-saturate-150">
                <span className="text-sm leading-snug font-bold uppercase tracking-wide text-brand-dark">
                  {t("marketplace.premiumOverlay.title")}
                </span>
                <button
                  type="button"
                  onClick={() => setUnlockTarget(activeTemplatePreset)}
                  className="rounded-full bg-linear-to-r from-brand to-brand-secondary px-5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-brand/30"
                >
                  {t("marketplace.premiumOverlay.unlockFor", {
                    price: design.price,
                  })}
                </button>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-text">
              {t("builder.customizePage.locked.title", {
                style: t(
                  `marketplace.styleNames.${activeTemplatePreset.styleKey}`,
                ),
              })}
            </p>
            <p className="text-sm text-text-secondary mt-1.5 max-w-sm">
              {t("builder.customizePage.locked.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/marketplace", { state: { restyle: true } })}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text transition-colors"
          >
            {t("builder.customizePage.locked.changeTemplate")}
          </button>
        </div>

        <UnlockTemplateModal
          open={unlockTarget !== null}
          preset={unlockTarget}
          onCancel={() => setUnlockTarget(null)}
          onUnlock={async () => {
            if (!unlockTarget) return;
            await unlockPremiumTemplate(unlockTarget.id);
            updateCustomization(designWithoutHeadingLanguage(unlockTarget.customization));
            setUnlockTarget(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold">
          {t("builder.customizePage.title")}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.customizePage.subtitle")}
        </p>
      </div>

      <div className="md:hidden sticky top-0 z-20 -mx-4 mt-4 overflow-x-auto bg-bg will-change-transform">
        <div className="flex gap-2 px-4 py-2 w-max">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => scrollTo(item.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeSection === item.key
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-line text-text-secondary hover:text-text",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 items-start mt-5 md:mt-8">
        {/* ---------- section nav (desktop) ---------- */}
        <div className="hidden md:block w-32 km:w-36 shrink-0 sticky top-4 self-start">
          <div className="relative flex flex-col gap-1 border-l border-line">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => scrollTo(item.key)}
                className={cn(
                  "relative -ml-px whitespace-nowrap km:whitespace-normal km:leading-snug text-left text-sm py-2.5 pl-3.5 pr-2 rounded-r-md",
                  activeSection === item.key
                    ? "bg-brand/5 text-brand font-medium"
                    : "text-text-secondary transition-colors hover:text-text hover:bg-surface-2",
                )}
              >
                {activeSection === item.key && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-brand" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- sections ---------- */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* change templates */}
          <div className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.templates.title")}
            </p>
            <p className="text-xs text-text-secondary -mt-3">
              {t("builder.customizePage.templates.subtitle")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {templateSuggestions.map((preset) => (
                <TemplateSwitchThumb
                  key={preset.id}
                  preset={preset}
                  onSelect={selectTemplate}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate("/marketplace", { state: { restyle: true } })}
              className="w-full rounded-full border border-line text-text text-sm font-medium py-2.5 transition-colors hover:bg-surface-2"
            >
              {t("builder.customizePage.templates.button")}
            </button>
          </div>

          {/* ================= colors ================= */}
          <div ref={colorsRef} data-section="colors" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.colors")}
            </p>

            <div className="space-y-5">
              <ColorSwatchGroup
                label={t("builder.customizePage.colors.textColor")}
                options={TEXT_COLOR_PRESETS}
                value={customization.bodyTextColor}
                onChange={(c) => updateCustomization({ bodyTextColor: c })}
              />
              <ColorSwatchGroup
                label={t("builder.customizePage.colors.background")}
                options={BACKGROUND_COLOR_PRESETS}
                value={customization.bodyBgColor}
                onChange={(c) => updateCustomization({ bodyBgColor: c })}
              />
              {showSidebarColor && (
                <SidebarColorPicker
                  color={customization.sidebarBgColor}
                  onChange={(c) => updateCustomization({ sidebarBgColor: c })}
                />
              )}
            </div>

            <div className="border-t border-line" />

            <PremiumGate
              locked={!hasFullCustomizationAccess}
              onUpgrade={openUpgrade}
            >
              <div className="space-y-5">
                <AccentColorPicker
                  color={customization.accentColor}
                  onChange={(c) => updateCustomization({ accentColor: c })}
                />

                <div className="space-y-2.5">
                  <p className={COLOR_LABEL}>
                    {t("builder.customizePage.colors.applyAccentTo")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyName")}
                      selected={customization.toggles.fullName}
                      onClick={() => patchToggle("fullName")}
                    />
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyJobTitle")}
                      selected={customization.toggles.jobTitle}
                      onClick={() => patchToggle("jobTitle")}
                    />
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyHeadings")}
                      selected={customization.toggles.headings}
                      onClick={() => patchToggle("headings")}
                    />
                    <ToggleChip
                      label={t(
                        "builder.customizePage.colors.applyHeadingLine",
                      )}
                      selected={customization.toggles.headingsLine}
                      onClick={() => patchToggle("headingsLine")}
                    />
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyDots")}
                      selected={customization.toggles.dots}
                      onClick={() => patchToggle("dots")}
                    />
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyDates")}
                      selected={customization.toggles.dates}
                      onClick={() => patchToggle("dates")}
                    />
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyLinkIcons")}
                      selected={customization.toggles.linkIcons}
                      onClick={() => patchToggle("linkIcons")}
                    />
                    <ToggleChip
                      label={t(
                        "builder.customizePage.colors.applyHeaderIcons",
                      )}
                      selected={customization.toggles.headerIcons}
                      onClick={() => patchToggle("headerIcons")}
                    />
                    <ToggleChip
                      label={t("builder.customizePage.colors.applyTimeline")}
                      selected={customization.toggles.timeline}
                      onClick={() => patchToggle("timeline")}
                    />
                  </div>
                </div>
              </div>
            </PremiumGate>
          </div>

          {/* ================= font ================= */}
          <div ref={fontRef} data-section="font" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.font")}
            </p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.font.fontFamily")}
              </p>
              <Select
                value={customization.fontFamily}
                onValueChange={(v) =>
                  updateCustomization({
                    fontFamily: v ?? customization.fontFamily,
                  })
                }
              >
                <SelectTrigger className="w-full h-10">
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
              {customization.headingLanguage === "km" && (
                <p className="text-xs text-text-secondary">
                  {t("builder.customizePage.font.khmerHint")}
                </p>
              )}
            </div>
          </div>

          {/* ================= font size ================= */}
          <div
            ref={fontSizeRef}
            data-section="fontSize"
            className={SECTION_CARD}
          >
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.fontSize")}
            </p>
            <SliderRow
              label={t("builder.customizePage.fontSize.fontSize")}
              value={customization.fontSize}
              displayValue={`${customization.fontSize}px`}
              min={11}
              max={18}
              step={0.5}
              onChange={(v) => updateCustomization({ fontSize: v })}
            />
            <SliderRow
              label={t("builder.customizePage.fontSize.fullName")}
              value={customization.fullNameSize}
              displayValue={`${customization.fullNameSize}px`}
              min={16}
              max={40}
              onChange={(v) => updateCustomization({ fullNameSize: v })}
            />
            <SliderRow
              label={t("builder.customizePage.fontSize.professionalTitle")}
              value={customization.titleSize}
              displayValue={`${customization.titleSize}px`}
              min={10}
              max={24}
              onChange={(v) => updateCustomization({ titleSize: v })}
            />
            <SliderRow
              label={t("builder.customizePage.fontSize.sectionHeadings")}
              value={customization.headingsSize}
              displayValue={`${customization.headingsSize}px`}
              min={8}
              max={16}
              onChange={(v) => updateCustomization({ headingsSize: v })}
            />
          </div>

          {/* ================= layout ================= */}
          <div ref={layoutRef} data-section="layout" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.layout")}
            </p>

            {isSpecialLayout ? (
              <p className="text-xs text-text-secondary -mt-1">
                {t("builder.customizePage.layout.specialLayoutHint")}
              </p>
            ) : (
              <>
                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-text">
                    {t("builder.customizePage.layout.columns")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard
                      label={t("builder.customizePage.layout.columnsOne")}
                      selected={customization.columns === "one"}
                      onClick={() => updateCustomization({ columns: "one" })}
                    >
                      <ColumnsPreview columns="one" />
                    </OptionCard>
                    <OptionCard
                      label={t("builder.customizePage.layout.columnsTwo")}
                      selected={customization.columns === "two"}
                      onClick={() => updateCustomization({ columns: "two" })}
                      premiumLocked={!hasFullCustomizationAccess}
                    >
                      <ColumnsPreview columns="two" />
                    </OptionCard>
                  </div>
                  {!hasFullCustomizationAccess && (
                    <p className="text-xs text-text-secondary">
                      {t("builder.customizePage.layout.columnsTwoPremiumHint")}
                    </p>
                  )}
                </div>

                {customization.columns === "two" && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-medium text-text">
                      {t("builder.customizePage.layout.headerPosition")}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <OptionCard
                        label={t("builder.customizePage.layout.headerLeft")}
                        selected={customization.headerPosition === "left"}
                        onClick={() =>
                          updateCustomization({ headerPosition: "left" })
                        }
                      >
                        <HeaderPositionPreview position="left" />
                      </OptionCard>
                      <OptionCard
                        label={t("builder.customizePage.layout.headerTop")}
                        selected={customization.headerPosition === "top"}
                        onClick={() =>
                          updateCustomization({ headerPosition: "top" })
                        }
                      >
                        <HeaderPositionPreview position="top" />
                      </OptionCard>
                      <OptionCard
                        label={t("builder.customizePage.layout.headerRight")}
                        selected={customization.headerPosition === "right"}
                        onClick={() =>
                          updateCustomization({ headerPosition: "right" })
                        }
                      >
                        <HeaderPositionPreview position="right" />
                      </OptionCard>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
                  <p className="min-w-0 truncate text-sm font-medium text-text">
                    {t("builder.customizePage.layout.topAccentBar")}
                  </p>
                  <Switch
                    checked={customization.topAccentBar}
                    onCheckedChange={(v) =>
                      updateCustomization({ topAccentBar: v })
                    }
                    ariaLabel={t("builder.customizePage.layout.topAccentBar")}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
                  <p className="min-w-0 truncate text-sm font-medium text-text">
                    {t("builder.customizePage.layout.footerBar")}
                  </p>
                  <Switch
                    checked={customization.footerBar}
                    onCheckedChange={(v) =>
                      updateCustomization({ footerBar: v })
                    }
                    ariaLabel={t("builder.customizePage.layout.footerBar")}
                  />
                </div>

                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-text">
                    {t("builder.customizePage.layout.sectionLayout")}
                  </p>
                  {customization.columns === "two" ? (
                    <div className="space-y-2.5">
                      {customization.headerPosition === "top" && (
                        <DragRow
                          label={t(
                            "builder.customizePage.layout.personalDetails",
                          )}
                          pinned
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className="space-y-2 min-h-8"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragSectionKey)
                              dropSectionInColumn(dragSectionKey, false);
                            setDragSectionKey(null);
                          }}
                        >
                          {customization.headerPosition !== "top" && (
                            <DragRow
                              label={t(
                                "builder.customizePage.layout.personalDetails",
                              )}
                              pinned
                            />
                          )}
                          {mainSectionKeys
                            .filter((key) => sectionHasContent[key])
                            .map((key) => (
                              <DragRow
                                key={key}
                                label={t(`builder.customizePage.layout.${key}`)}
                                draggable
                                onDragStart={() => setDragSectionKey(key)}
                                onDropOn={() => {
                                  if (dragSectionKey)
                                    dropSectionOnRow(dragSectionKey, key);
                                  setDragSectionKey(null);
                                }}
                              />
                            ))}
                        </div>
                        <div
                          className="space-y-2 min-h-8"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragSectionKey)
                              dropSectionInColumn(dragSectionKey, true);
                            setDragSectionKey(null);
                          }}
                        >
                          {sidebarSectionKeys
                            .filter((key) => sectionHasContent[key])
                            .map((key) => (
                              <DragRow
                                key={key}
                                label={t(`builder.customizePage.layout.${key}`)}
                                draggable
                                onDragStart={() => setDragSectionKey(key)}
                                onDropOn={() => {
                                  if (dragSectionKey)
                                    dropSectionOnRow(dragSectionKey, key);
                                  setDragSectionKey(null);
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <DragRow
                        label={t(
                          "builder.customizePage.layout.personalDetails",
                        )}
                        pinned
                      />
                      {customization.sectionOrder
                        .filter((key) => sectionHasContent[key])
                        .map((key) => (
                          <DragRow
                            key={key}
                            label={t(`builder.customizePage.layout.${key}`)}
                            draggable
                            onDragStart={() => setDragSectionKey(key)}
                            onDropOn={() => {
                              if (dragSectionKey)
                                moveSectionOrder(dragSectionKey, key);
                              setDragSectionKey(null);
                            }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.skillsDisplay")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <OptionCard
                  label={t("builder.customizePage.layout.skillsMeter")}
                  selected={customization.skillsDisplay === "meter"}
                  onClick={() =>
                    updateCustomization({
                      skillsDisplay: "meter",
                      toggles: { ...customization.toggles, dots: true },
                    })
                  }
                />
                <OptionCard
                  label={t("builder.customizePage.layout.skillsList")}
                  selected={customization.skillsDisplay === "list"}
                  onClick={() =>
                    updateCustomization({ skillsDisplay: "list" })
                  }
                />
              </div>
            </div>

            {showPhotoToggle && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-medium text-text">
                {t("builder.customizePage.layout.showPhoto")}
              </p>
              <Switch
                checked={customization.showPhoto}
                onCheckedChange={(v) => updateCustomization({ showPhoto: v })}
                ariaLabel={t("builder.customizePage.layout.showPhoto")}
              />
            </div>
            )}

            {showPhotoToggle &&
              customization.showPhoto &&
              !isSpecialLayout &&
              customization.columns === "two" && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
                <p className="min-w-0 truncate text-sm font-medium text-text">
                  {t("builder.customizePage.layout.sidebarPhotoFill")}
                </p>
                <Switch
                  checked={customization.sidebarPhotoFill}
                  onCheckedChange={(v) =>
                    updateCustomization({ sidebarPhotoFill: v })
                  }
                  ariaLabel={t("builder.customizePage.layout.sidebarPhotoFill")}
                />
              </div>
            )}

            {showPhotoToggle &&
              customization.showPhoto &&
              showPhotoStyleControls && (
              <PremiumGate
                locked={!hasFullCustomizationAccess}
                onUpgrade={openUpgrade}
              >
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <p className="text-sm font-medium text-text">
                      {t("builder.customizePage.layout.photoShape")}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <OptionCard
                        label={t("builder.customizePage.layout.shapeCircle")}
                        selected={customization.photoShape === "circle"}
                        onClick={() =>
                          updateCustomization({ photoShape: "circle" })
                        }
                      >
                        <div
                          className={cn(
                            "size-8 rounded-full",
                            customization.photoShape === "circle"
                              ? "bg-brand"
                              : "bg-line/60",
                          )}
                        />
                      </OptionCard>
                      <OptionCard
                        label={t("builder.customizePage.layout.shapeRounded")}
                        selected={customization.photoShape === "rounded"}
                        onClick={() =>
                          updateCustomization({ photoShape: "rounded" })
                        }
                      >
                        <div
                          className={cn(
                            "size-8 rounded-md",
                            customization.photoShape === "rounded"
                              ? "bg-brand"
                              : "bg-line/60",
                          )}
                        />
                      </OptionCard>
                      <OptionCard
                        label={t("builder.customizePage.layout.shapeSquare")}
                        selected={customization.photoShape === "square"}
                        onClick={() =>
                          updateCustomization({ photoShape: "square" })
                        }
                      >
                        <div
                          className={cn(
                            "size-8",
                            customization.photoShape === "square"
                              ? "bg-brand"
                              : "bg-line/60",
                          )}
                        />
                      </OptionCard>
                    </div>
                  </div>

                  <SliderRow
                    label={t("builder.customizePage.layout.photoSize")}
                    value={customization.photoSize}
                    displayValue={`${customization.photoSize}px`}
                    min={40}
                    max={140}
                    onChange={(v) => updateCustomization({ photoSize: v })}
                  />

                  <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
                    <p className="min-w-0 truncate text-sm font-medium text-text">
                      {t("builder.customizePage.layout.photoBorder")}
                    </p>
                    <Switch
                      checked={customization.photoBorder}
                      onCheckedChange={(v) =>
                        updateCustomization({ photoBorder: v })
                      }
                      ariaLabel={t("builder.customizePage.layout.photoBorder")}
                    />
                  </div>
                </div>
              </PremiumGate>
            )}

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.pageFormat")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <OptionCard
                  label={t("builder.customizePage.layout.formatA4")}
                  selected={customization.pageFormat === "a4"}
                  onClick={() => updateCustomization({ pageFormat: "a4" })}
                />
                <OptionCard
                  label={t("builder.customizePage.layout.formatLetter")}
                  selected={customization.pageFormat === "letter"}
                  onClick={() => updateCustomization({ pageFormat: "letter" })}
                />
              </div>
            </div>
          </div>

          {/* ================= header ================= */}
          {!isSpecialLayout && (
          <div ref={headerRef} data-section="header" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.header")}
            </p>

            <PremiumGate
              locked={!hasFullCustomizationAccess}
              onUpgrade={openUpgrade}
            >
            <div className="space-y-6">
            {headerIsBanner && (
              <>
                {customization.showPhoto && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-medium text-text">
                      {t("builder.customizePage.header.photoLayout")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <OptionCard
                        label={t("builder.customizePage.header.photoStacked")}
                        selected={customization.headerLayout === "stacked"}
                        onClick={() =>
                          updateCustomization({ headerLayout: "stacked" })
                        }
                      >
                        <PhotoLayoutPreview layout="stacked" />
                      </OptionCard>
                      <OptionCard
                        label={t("builder.customizePage.header.photoRow")}
                        selected={customization.headerLayout === "row"}
                        onClick={() =>
                          updateCustomization({ headerLayout: "row" })
                        }
                      >
                        <PhotoLayoutPreview layout="row" />
                      </OptionCard>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-text">
                    {t("builder.customizePage.header.textAlignment")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard
                      label={t("builder.customizePage.header.alignLeft")}
                      selected={customization.headerAlignment === "left"}
                      onClick={() =>
                        updateCustomization({ headerAlignment: "left" })
                      }
                    >
                      <HeaderAlignmentPreview align="left" />
                    </OptionCard>
                    <OptionCard
                      label={t("builder.customizePage.header.alignCenter")}
                      selected={customization.headerAlignment === "center"}
                      onClick={() =>
                        updateCustomization({ headerAlignment: "center" })
                      }
                    >
                      <HeaderAlignmentPreview align="center" />
                    </OptionCard>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-text">
                    {t("builder.customizePage.header.detailsArrangement")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard
                      label={t(
                        "builder.customizePage.header.arrangementInline",
                      )}
                      selected={customization.contactArrangement === "inline"}
                      onClick={() =>
                        updateCustomization({ contactArrangement: "inline" })
                      }
                    >
                      <ContactArrangementPreview arrangement="inline" />
                    </OptionCard>
                    <OptionCard
                      label={t(
                        "builder.customizePage.header.arrangementStacked",
                      )}
                      selected={customization.contactArrangement === "stacked"}
                      onClick={() =>
                        updateCustomization({ contactArrangement: "stacked" })
                      }
                    >
                      <ContactArrangementPreview arrangement="stacked" />
                    </OptionCard>
                  </div>
                </div>

                {customization.contactArrangement === "inline" && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-medium text-text">
                      {t("builder.customizePage.header.separator")}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {CONTACT_SEPARATOR_OPTIONS.map((option) => (
                        <OptionCard
                          key={option}
                          label={t(
                            `builder.customizePage.header.${CONTACT_SEPARATOR_LABEL_KEY[option]}`,
                          )}
                          selected={customization.contactSeparator === option}
                          onClick={() =>
                            updateCustomization({ contactSeparator: option })
                          }
                        >
                          <ContactSeparatorPreview separator={option} />
                        </OptionCard>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.header.iconStyle")}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {ICON_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    title={t(
                      `builder.customizePage.header.${ICON_STYLE_LABEL_KEY[style]}`,
                    )}
                    onClick={() => updateCustomization({ iconStyle: style })}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg border-2 transition-colors",
                      customization.iconStyle === style
                        ? "border-brand bg-brand/5"
                        : "border-line hover:bg-surface-2",
                    )}
                  >
                    <IconStyleSwatch
                      style={style}
                      accentColor={customization.accentColor}
                    />
                  </button>
                ))}
              </div>
            </div>
            </div>
            </PremiumGate>
          </div>
          )}

          {/* ================= section headings ================= */}
          <div
            ref={sectionHeadingsRef}
            data-section="sectionHeadings"
            className={SECTION_CARD}
          >
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.sectionHeadings")}
            </p>

            <ResumeLanguageToggle
              value={customization.headingLanguage === "km" ? "km" : "en"}
              onChange={(lang) => updateCustomization({ headingLanguage: lang })}
              showHint
            />

            <PremiumGate
              locked={!hasFullCustomizationAccess}
              onUpgrade={openUpgrade}
            >
            <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HEADING_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  title={t(
                    `builder.customizePage.sectionHeadings.${HEADING_BORDER_LABEL_KEY[preset.headingBorder]}`,
                  )}
                  onClick={() => applyHeadingPreset(i)}
                  className={cn(
                    "rounded-lg border-2 flex flex-col items-center justify-center gap-2 p-4 transition-colors",
                    activeHeadingPreset === i
                      ? "border-brand bg-brand/5 ring-1 ring-brand"
                      : "border-line hover:bg-surface-2 hover:border-line/70",
                  )}
                >
                  <HeadingPresetPreview
                    preset={preset}
                    capitalization={customization.capitalization}
                    accentColor={customization.accentColor}
                  />
                </button>
              ))}
            </div>

            {customization.headingLanguage !== "km" && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.capitalization")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <OptionCard
                  label={t("builder.customizePage.sectionHeadings.capitalize")}
                  selected={customization.capitalization === "capitalize"}
                  onClick={() =>
                    updateCustomization({ capitalization: "capitalize" })
                  }
                />
                <OptionCard
                  label={t("builder.customizePage.sectionHeadings.uppercase")}
                  selected={customization.capitalization === "uppercase"}
                  onClick={() =>
                    updateCustomization({ capitalization: "uppercase" })
                  }
                />
              </div>
            </div>
            )}

            {!isSpecialLayout && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.sectionIcon")}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SECTION_ICON_OPTIONS.map((option) => (
                  <OptionCard
                    key={option}
                    label={t(
                      `builder.customizePage.sectionHeadings.${SECTION_ICON_LABEL_KEY[option]}`,
                    )}
                    selected={customization.sectionIcon === option}
                    onClick={() => updateCustomization({ sectionIcon: option })}
                  />
                ))}
              </div>
            </div>
            )}

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.linkStyle")}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <OptionCard
                  label={t(
                    "builder.customizePage.sectionHeadings.linkUnderline",
                  )}
                  selected={customization.linkStyle.includes("underline")}
                  onClick={() => toggleLinkStyle("underline")}
                />
                <OptionCard
                  label={t("builder.customizePage.sectionHeadings.linkColor")}
                  selected={customization.linkStyle.includes("color")}
                  onClick={() => toggleLinkStyle("color")}
                />
                <OptionCard
                  label={t("builder.customizePage.sectionHeadings.linkIcon")}
                  selected={customization.linkStyle.includes("icon")}
                  onClick={() => toggleLinkStyle("icon")}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.bulletStyle")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {BULLET_STYLE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option}
                    label={t(
                      `builder.customizePage.sectionHeadings.${BULLET_STYLE_LABEL_KEY[option]}`,
                    )}
                    selected={customization.bulletStyle === option}
                    onClick={() => updateCustomization({ bulletStyle: option })}
                  >
                    <span
                      className="text-base leading-none"
                      style={{ color: customization.accentColor }}
                    >
                      {BULLET_STYLE_GLYPH[option] || "-"}
                    </span>
                  </OptionCard>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.dateFormat")}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <OptionCard
                    key={option}
                    label={t(
                      `builder.customizePage.sectionHeadings.${DATE_FORMAT_LABEL_KEY[option]}`,
                    )}
                    selected={customization.dateFormat === option}
                    onClick={() => updateCustomization({ dateFormat: option })}
                  />
                ))}
              </div>
            </div>

            {customization.headingLanguage !== "km" && (
            <SliderRow
              label={t("builder.customizePage.sectionHeadings.letterSpacing")}
              value={customization.headingsLetterSpacing}
              displayValue={`${customization.headingsLetterSpacing}px`}
              min={0}
              max={3}
              step={0.5}
              onChange={(v) =>
                updateCustomization({ headingsLetterSpacing: v })
              }
            />
            )}
            </div>
            </PremiumGate>
          </div>

          {/* ================= spacing ================= */}
          <div ref={spacingRef} data-section="spacing" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.spacing")}
            </p>
            <PremiumGate
              locked={!hasFullCustomizationAccess}
              onUpgrade={openUpgrade}
            >
              <div className="space-y-6">
                <SliderRow
                  label={t("builder.customizePage.spacing.lineHeight")}
                  value={customization.lineHeight}
                  displayValue={customization.lineHeight.toFixed(2)}
                  min={1}
                  max={2.2}
                  step={0.05}
                  onChange={(v) => updateCustomization({ lineHeight: v })}
                />
                <SliderRow
                  label={t("builder.customizePage.spacing.elementSpacing")}
                  value={customization.elementSpacing}
                  displayValue={`${customization.elementSpacing}px`}
                  min={0}
                  max={30}
                  onChange={(v) => updateCustomization({ elementSpacing: v })}
                />
                {!isSpecialLayout && (
                <>
                <SliderRow
                  label={t("builder.customizePage.spacing.topBottomMargin")}
                  value={customization.topBottomMargin}
                  displayValue={`${customization.topBottomMargin}mm`}
                  min={6}
                  max={30}
                  step={1}
                  onChange={(v) => updateCustomization({ topBottomMargin: v })}
                />
                <SliderRow
                  label={t("builder.customizePage.spacing.leftRightMargin")}
                  value={customization.leftRightMargin}
                  displayValue={`${customization.leftRightMargin}mm`}
                  min={6}
                  max={30}
                  step={1}
                  onChange={(v) => updateCustomization({ leftRightMargin: v })}
                />
                </>
                )}
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3">
                  <p className="min-w-0 truncate text-sm font-medium text-text">
                    {t("builder.customizePage.spacing.pageBorder")}
                  </p>
                  <Switch
                    checked={customization.pageBorder}
                    onCheckedChange={(v) =>
                      updateCustomization({ pageBorder: v })
                    }
                    ariaLabel={t("builder.customizePage.spacing.pageBorder")}
                  />
                </div>

                {customization.pageBorder && (
                  <SliderRow
                    label={t("builder.customizePage.spacing.pageBorderWidth")}
                    value={customization.pageBorderWidth}
                    displayValue={`${customization.pageBorderWidth}px`}
                    min={0.5}
                    max={6}
                    step={0.5}
                    onChange={(v) =>
                      updateCustomization({ pageBorderWidth: v })
                    }
                  />
                )}
              </div>
            </PremiumGate>
          </div>
        </div>
      </div>

      <UnlockTemplateModal
        open={unlockTarget !== null}
        preset={unlockTarget}
        onCancel={() => setUnlockTarget(null)}
        onUnlock={async () => {
          if (!unlockTarget) return;
          await unlockPremiumTemplate(unlockTarget.id);
          updateCustomization(designWithoutHeadingLanguage(unlockTarget.customization));
          setUnlockTarget(null);
        }}
      />
    </div>
  );
}

/* =========================================================== helpers === */

/** small "page thumbnail" used inside an OptionCard's preview slot */
const THUMB =
  "h-11 w-full rounded-md border border-line/70 bg-bg p-1.5 flex gap-1";

function ContentLines({ count = 3 }: { count?: number }) {
  const widths = ["w-full", "w-4/5", "w-3/5", "w-2/5"];
  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col justify-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn("h-1 rounded-full bg-line", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}
function ColumnsPreview({ columns }: { columns: "one" | "two" }) {
  if (columns === "one") {
    return (
      <div className={THUMB}>
        <ContentLines count={4} />
      </div>
    );
  }
  return (
    <div className={THUMB}>
      <div className="w-[34%] rounded-sm bg-surface-2 flex flex-col justify-center gap-1 px-1.5">
        <div className="h-1 rounded-full bg-line w-full" />
        <div className="h-1 rounded-full bg-line w-2/3" />
      </div>
      <div className="flex-1 min-w-0 rounded-sm bg-surface-2 flex flex-col justify-center gap-1 px-1.5">
        <ContentLines count={3} />
      </div>
    </div>
  );
}
function HeaderPositionPreview({
  position,
}: {
  position: "left" | "top" | "right";
}) {
  const band = (
    <div
      className={cn(
        "rounded-sm bg-brand/80",
        position === "top" ? "h-[38%] w-full" : "h-full w-[30%]",
      )}
    />
  );
  const content = (
    <div className="flex-1 min-w-0 min-h-0 rounded-sm bg-surface-2 flex flex-col justify-center gap-1 px-1.5">
      <div className="h-1 rounded-full bg-line w-4/5" />
      <div className="h-1 rounded-full bg-line w-3/5" />
      {position === "top" && <div className="h-1 rounded-full bg-line w-2/5" />}
    </div>
  );
  return (
    <div className={cn(THUMB, position === "top" && "flex-col")}>
      {position === "right" ? (
        <>
          {content}
          {band}
        </>
      ) : (
        <>
          {band}
          {content}
        </>
      )}
    </div>
  );
}

function PhotoLayoutPreview({ layout }: { layout: "stacked" | "row" }) {
  if (layout === "row") {
    return (
      <div className={cn(THUMB, "items-center gap-1.5 px-2")}>
        <div className="size-5 shrink-0 rounded-full bg-brand/70" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="h-1.5 w-4/5 rounded-full bg-line" />
          <div className="h-1 w-3/5 rounded-full bg-line" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn(THUMB, "flex-col items-center justify-center gap-1")}>
      <div className="size-5 rounded-full bg-brand/70" />
      <div className="h-1.5 w-3/5 rounded-full bg-line" />
    </div>
  );
}

function HeaderAlignmentPreview({ align }: { align: "left" | "center" }) {
  const isLeft = align === "left";
  return (
    <div className={cn(THUMB, "flex-col justify-center gap-1 px-2")}>
      <div
        className={cn(
          "h-1.5 rounded-full bg-brand/70",
          isLeft ? "w-1/2 self-start" : "w-1/2 self-center",
        )}
      />
      <div
        className={cn(
          "h-1 rounded-full bg-line",
          isLeft ? "w-3/5 self-start" : "w-3/5 self-center",
        )}
      />
    </div>
  );
}

function ContactArrangementPreview({
  arrangement,
}: {
  arrangement: "inline" | "stacked";
}) {
  if (arrangement === "stacked") {
    return (
      <div className={cn(THUMB, "flex-col justify-center gap-1 px-2")}>
        <div className="h-1 w-3/5 rounded-full bg-line" />
        <div className="h-1 w-2/5 rounded-full bg-line" />
        <div className="h-1 w-1/2 rounded-full bg-line" />
      </div>
    );
  }
  return (
    <div className={cn(THUMB, "items-center justify-center gap-1 px-2")}>
      <div className="h-1 w-1/4 rounded-full bg-line" />
      <div className="h-1 w-1/5 rounded-full bg-line" />
      <div className="h-1 w-1/4 rounded-full bg-line" />
    </div>
  );
}
function ContactSeparatorPreview({
  separator,
}: {
  separator: Customization["contactSeparator"];
}) {
  if (separator === "icon") {
    return (
      <div className={cn(THUMB, "items-center justify-center gap-2.5 px-2")}>
        <div className="flex items-center gap-1">
          <Globe
            size={9}
            strokeWidth={2}
            className="shrink-0 text-text-secondary"
          />
          <div className="h-1 w-3 rounded-full bg-line" />
        </div>
        <div className="flex items-center gap-1">
          <Globe
            size={9}
            strokeWidth={2}
            className="shrink-0 text-text-secondary"
          />
          <div className="h-1 w-3 rounded-full bg-line" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn(THUMB, "items-center justify-center gap-1.5 px-2")}>
      <div className="h-1 w-4 rounded-full bg-line" />
      <span className="text-[10px] leading-none text-text-secondary">
        {separator === "bullet" ? "•" : "|"}
      </span>
      <div className="h-1 w-4 rounded-full bg-line" />
    </div>
  );
}
function IconStyleSwatch({
  style,
  accentColor,
  size = "md",
}: {
  style: Customization["iconStyle"];
  accentColor: string;
  size?: "sm" | "md";
}) {
  const badgeSize = size === "sm" ? 20 : 26;
  const glyphSize = size === "sm" ? 11 : 14;
  const plainGlyphSize = size === "sm" ? 13 : 18;
  if (style === "plain" || style === "faded") {
    return (
      <Globe
        size={plainGlyphSize}
        strokeWidth={1.8}
        className={cn("text-text-secondary", style === "faded" && "opacity-50")}
      />
    );
  }
  const isFilled = style === "filled" || style === "square";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        style === "square" ? "rounded-sm" : "rounded-full",
        !isFilled && "border",
      )}
      style={{
        width: badgeSize,
        height: badgeSize,
        backgroundColor: isFilled ? accentColor : undefined,
        borderColor: isFilled ? undefined : accentColor,
      }}
    >
      <Globe
        size={glyphSize}
        strokeWidth={1.8}
        color={isFilled ? "#fff" : accentColor}
      />
    </span>
  );
}

function HeadingPresetPreview({
  preset,
  capitalization,
  accentColor,
}: {
  preset: HeadingPreset;
  capitalization: Customization["capitalization"];
  accentColor: string;
}) {
  const isFilled = preset.headingBorder === "filled";
  const isOutline = preset.headingBorder === "outline";
  const isLongLine = preset.headingBorder === "line";
  const isLongUnderline = preset.headingBorder === "underline";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {isLongLine ? (
        <div className="flex w-full items-center gap-1.5">
          <span
            className={cn(
              "shrink-0 text-[9px] font-bold leading-none tracking-[0.15em]",
              capitalization,
            )}
            style={{ color: accentColor }}
          >
            heading
          </span>
          <div
            className="h-px flex-1"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      ) : isLongUnderline ? (
        <div className="flex w-full flex-col items-start gap-1.5">
          <span
            className={cn(
              "text-[9px] font-bold leading-none tracking-[0.15em]",
              capitalization,
            )}
            style={{ color: accentColor }}
          >
            heading
          </span>
          <div
            className="h-px w-full"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      ) : (
        <span
          className={cn(
            "text-[9px] font-bold leading-none tracking-[0.15em]",
            capitalization,
            isFilled
              ? "rounded px-1.5 py-1 text-white"
              : isOutline
                ? "rounded-sm border px-1.5 py-1"
                : preset.headingsLine && "border-b pb-0.5",
          )}
          style={{
            color: isFilled ? "#fff" : accentColor,
            backgroundColor: isFilled ? accentColor : undefined,
            borderColor:
              isOutline || preset.headingsLine ? accentColor : undefined,
          }}
        >
          heading
        </span>
      )}
      <div className="flex w-full flex-col items-center gap-1">
        <div className="h-1 w-full rounded-full bg-line/70" />
        <div className="h-1 w-2/3 rounded-full bg-line/70" />
      </div>
    </div>
  );
}

/** dims+disables a block of premium-only controls and overlays a small
 *  upgrade prompt - used to gate whole sections (colors' accent block,
 *  header, section headings, spacing, photo styling) behind a one-time
 *  pack or an unlocked premium template */
function PremiumGate({
  locked,
  onUpgrade,
  children,
}: {
  locked: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-lg bg-bg/70 px-4 text-center backdrop-blur-[1px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950">
          <Crown size={12} strokeWidth={2.5} />
          {t("marketplace.premiumBadge")}
        </span>
        <p className="max-w-60 text-xs text-text-secondary">
          {t("builder.customizePage.premiumGate.description")}
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-full bg-brand text-white text-xs font-medium px-4 py-2"
        >
          {t("builder.customizePage.premiumGate.cta")}
        </button>
      </div>
    </div>
  );
}

function OptionCard({
  label,
  selected,
  onClick,
  children,
  premiumLocked,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  /** shows a premium badge and blocks the click instead of applying it -
   *  used to keep premium-only layout options visible but unreachable from
   *  a free template, so free resumes can't be dialed in to look premium */
  premiumLocked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={premiumLocked ? undefined : onClick}
      aria-disabled={premiumLocked}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors",
        premiumLocked
          ? "cursor-not-allowed border-line opacity-60"
          : selected
            ? "border-brand bg-brand/5"
            : "border-line hover:bg-surface-2",
      )}
    >
      {premiumLocked && (
        <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center rounded-full bg-linear-to-r from-amber-400 to-yellow-500 p-1 text-amber-950">
          <Crown size={10} strokeWidth={2.5} />
        </span>
      )}
      {children}
      <span
        className={cn(
          "text-xs font-medium",
          selected && !premiumLocked ? "text-brand" : "text-text-secondary",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function TemplateSwitchThumb({
  preset,
  onSelect,
}: {
  preset: TemplatePreset;
  onSelect: (preset: TemplatePreset) => void;
}) {
  const { t } = useTranslation();
  const { design } = usePacks();
  const unlockedIds = useEntitlementStore((s) => s.unlockedTemplateIds);
  const templateSlots = useEntitlementStore((s) => s.templateSlots);
  const hasAccess = hasTemplateAccess(preset.id, unlockedIds, templateSlots);
  const isPremiumLocked = preset.tier === "premium" && !hasAccess;
  const resume = useMemo(
    () => demoResumeForPreset(preset.customization),
    [preset],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      title={t(`marketplace.styleNames.${preset.styleKey}`)}
      className="group relative min-w-0 overflow-hidden rounded-lg border-2 border-line bg-bg shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md"
    >
      <div className="pointer-events-none">
        <ResumePreview singlePage resume={resume} />
      </div>
      {isPremiumLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-1.5 flex max-w-[88%] flex-col items-center gap-1 rounded-lg bg-white/70 px-1.5 py-1.5 text-center shadow-[0_4px_12px_-3px_rgba(0,0,0,0.3)] ring-1 ring-black/6 backdrop-blur-sm transition-transform duration-200 group-hover:scale-[1.04]">
            <span className="text-[6px] leading-tight font-bold uppercase tracking-wide text-brand-dark">
              {t("marketplace.premiumOverlay.title")}
            </span>
            <span className="rounded-full bg-linear-to-r from-brand to-brand-secondary px-1.5 py-0.5 text-[6px] leading-none font-bold uppercase tracking-wide text-white shadow-sm shadow-brand/30">
              {t("marketplace.premiumOverlay.unlockFor", {
                price: design.price,
              })}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

function roundToStep(value: number, step: number) {
  const decimals = (step.toString().split(".")[1] || "").length;
  return Number(value.toFixed(decimals));
}

function SliderRow({
  label,
  value,
  displayValue,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const decrease = () => onChange(clamp(roundToStep(value - step, step)));
  const increase = () => onChange(clamp(roundToStep(value + step, step)));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-medium text-text">{label}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={decrease}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line text-text-secondary transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={12} />
          </button>
          <span className="min-w-[3.5ch] shrink-0 text-center font-medium text-brand">
            {displayValue}
          </span>
          <button
            type="button"
            onClick={increase}
            disabled={value >= max}
            aria-label={`Increase ${label}`}
            className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line text-text-secondary transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
    </div>
  );
}

function DragRow({
  label,
  tall,
  draggable,
  pinned,
  onDragStart,
  onDropOn,
}: {
  label: string;
  tall?: boolean;
  draggable?: boolean;
  /** always-first row (Personal Details) - shown but not reorderable */
  pinned?: boolean;
  onDragStart?: () => void;
  onDropOn?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={draggable ? (e) => e.preventDefault() : undefined}
      onDrop={
        onDropOn &&
        ((e) => {
          e.preventDefault();
          e.stopPropagation();
          onDropOn();
        })
      }
      title={pinned ? t("builder.customizePage.layout.alwaysFirst") : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text-secondary",
        tall && "py-4",
        draggable && "cursor-grab active:cursor-grabbing",
        pinned && "opacity-70",
      )}
    >
      {pinned ? (
        <Lock size={12} className="shrink-0 text-text-placeholder" />
      ) : (
        <GripVertical size={14} className="shrink-0 text-text-placeholder" />
      )}
      <span className="truncate">{label}</span>
    </div>
  );
}
function ColorSwatchGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { labelKey: string; value: string }[];
  value: string;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const isCustom = !options.some(
    (o) => o.value.toLowerCase() === value.toLowerCase(),
  );
  return (
    <div className="space-y-2.5">
      <p className={COLOR_LABEL}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const selected = value.toLowerCase() === option.value.toLowerCase();
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border-2 px-3.5 py-2.5 transition-colors",
                selected
                  ? "border-brand bg-brand/5"
                  : "border-line hover:bg-surface-2",
              )}
            >
              <span
                className="size-4 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: option.value }}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-brand" : "text-text",
                )}
              >
                {t(`builder.customizePage.colors.${option.labelKey}`)}
              </span>
            </button>
          );
        })}
        <Popover>
          <PopoverTrigger
            type="button"
            className={cn(
              "flex items-center gap-2.5 rounded-lg border-2 px-3.5 py-2.5 transition-colors",
              isCustom
                ? "border-brand bg-brand/5"
                : "border-dashed border-line hover:bg-surface-2",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                isCustom ? "border-black/10" : "border-line",
              )}
              style={isCustom ? { backgroundColor: value } : undefined}
            >
              {!isCustom && (
                <Pipette size={10} className="text-text-secondary" />
              )}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isCustom ? "text-brand" : "text-text",
              )}
            >
              {t("builder.customizePage.colors.custom")}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-3 p-3" align="start">
            <CustomColorFields
              color={isCustom ? value : options[0].value}
              onChange={onChange}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function AccentColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const isCustom = !ACCENT_COLORS.some(
    (p) => p.toLowerCase() === color.toLowerCase(),
  );

  return (
    <div className="space-y-2.5">
      <p className={COLOR_LABEL}>
        {t("builder.customizePage.colors.accentColor")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {ACCENT_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={preset}
            className={cn(
              "size-7 shrink-0 rounded-full border transition-transform hover:scale-110",
              color.toLowerCase() === preset.toLowerCase()
                ? "border-transparent ring-2 ring-offset-2 ring-offset-bg"
                : "border-line",
            )}
            style={{
              backgroundColor: preset,
              ...(color.toLowerCase() === preset.toLowerCase()
                ? ({ "--tw-ring-color": preset } as React.CSSProperties)
                : {}),
            }}
          />
        ))}
        <Popover>
          <PopoverTrigger
            type="button"
            aria-label={t("builder.customizePage.colors.custom")}
            title={t("builder.customizePage.colors.custom")}
            className={cn(
              "relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-transform hover:scale-110",
              isCustom
                ? "border-transparent ring-2 ring-offset-2 ring-offset-bg"
                : "border-dashed border-line",
            )}
            style={
              isCustom
                ? ({
                    backgroundColor: color,
                    "--tw-ring-color": color,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <Pipette
              size={12}
              className={isCustom ? undefined : "text-text-secondary"}
              style={isCustom ? { color: idealTextColor(color) } : undefined}
            />
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-3 p-3" align="start">
            <CustomColorFields color={color} onChange={onChange} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

const SIDEBAR_BG_PRESETS = [
  "#111827",
  "#1E293B",
  "#134E4A",
  "#1E1B4B",
  "#500724",
];

function SidebarColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const isNone = color === "";
  const isCustom =
    !isNone &&
    !SIDEBAR_BG_PRESETS.some((p) => p.toLowerCase() === color.toLowerCase());

  return (
    <div className="space-y-2.5">
      <p className={COLOR_LABEL}>
        {t("builder.customizePage.colors.sidebarBackground")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("builder.customizePage.colors.sidebarBackgroundNone")}
          title={t("builder.customizePage.colors.sidebarBackgroundNone")}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border bg-bg text-text-secondary transition-transform hover:scale-110",
            isNone
              ? "border-transparent ring-2 ring-brand ring-offset-2 ring-offset-bg"
              : "border-line",
          )}
        >
          <Minus size={12} />
        </button>
        {SIDEBAR_BG_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={preset}
            className={cn(
              "size-7 shrink-0 rounded-full border transition-transform hover:scale-110",
              color.toLowerCase() === preset.toLowerCase()
                ? "border-transparent ring-2 ring-offset-2 ring-offset-bg"
                : "border-line",
            )}
            style={{
              backgroundColor: preset,
              ...(color.toLowerCase() === preset.toLowerCase()
                ? ({ "--tw-ring-color": preset } as React.CSSProperties)
                : {}),
            }}
          />
        ))}
        <Popover>
          <PopoverTrigger
            type="button"
            aria-label={t("builder.customizePage.colors.custom")}
            title={t("builder.customizePage.colors.custom")}
            className={cn(
              "relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-transform hover:scale-110",
              isCustom
                ? "border-transparent ring-2 ring-offset-2 ring-offset-bg"
                : "border-dashed border-line",
            )}
            style={
              isCustom
                ? ({
                    backgroundColor: color,
                    "--tw-ring-color": color,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <Pipette
              size={12}
              className={isCustom ? undefined : "text-text-secondary"}
              style={isCustom ? { color: idealTextColor(color) } : undefined}
            />
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-3 p-3" align="start">
            <CustomColorFields color={color || "#1F2937"} onChange={onChange} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
function CustomColorFields({
  color,
  onChange,
}: {
  color: string;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const hexId = useFieldId();
  const rgb = hexToRgb(color);
  const [hexDraft, setHexDraft] = useState(color);
  useEffect(() => setHexDraft(color), [color]);

  const commitHex = (value: string) => {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
    if (!match) {
      setHexDraft(color);
      return;
    }
    const digits = match[1];
    const normalized =
      digits.length === 3
        ? `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`
        : `#${digits}`;
    onChange(normalized.toLowerCase());
  };

  const supportsEyeDropper =
    typeof window !== "undefined" && "EyeDropper" in window;
  const pickFromScreen = async () => {
    try {
      // EyeDropper is a browser API still missing from lib.dom.d.ts
      // @ts-expect-error -- see above
      const result = await new window.EyeDropper().open();
      onChange(result.sRGBHex);
    } catch {}
  };

  return (
    <div className="space-y-3">
      <HexColorPicker
        color={color}
        onChange={onChange}
        style={{ width: "100%", height: 160 }}
      />
      <div className="flex items-center gap-2">
        {supportsEyeDropper && (
          <button
            type="button"
            onClick={pickFromScreen}
            aria-label={t("builder.customizePage.colors.eyedropper")}
            title={t("builder.customizePage.colors.eyedropper")}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
          >
            <Pipette size={14} />
          </button>
        )}
        <div className="flex-1 space-y-1">
          <label
            htmlFor={hexId}
            className="block text-[10px] font-medium tracking-wide text-text-secondary uppercase"
          >
            {t("builder.customizePage.colors.hex")}
          </label>
          <input
            id={hexId}
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={(e) => commitHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitHex(hexDraft);
            }}
            spellCheck={false}
            maxLength={7}
            className="w-full rounded-md border border-line bg-bg px-2 py-1 text-xs font-mono uppercase text-text focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <RgbField
          label="R"
          value={rgb.r}
          onCommit={(v) => onChange(rgbToHex(v, rgb.g, rgb.b))}
        />
        <RgbField
          label="G"
          value={rgb.g}
          onCommit={(v) => onChange(rgbToHex(rgb.r, v, rgb.b))}
        />
        <RgbField
          label="B"
          value={rgb.b}
          onCommit={(v) => onChange(rgbToHex(rgb.r, rgb.g, v))}
        />
      </div>
    </div>
  );
}
function RgbField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  const inputId = useFieldId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    setDraft(String(clamped));
    onCommit(clamped);
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-center text-[10px] font-medium tracking-wide text-text-secondary uppercase"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="w-full rounded-md border border-line bg-bg px-2 py-1 text-center text-xs text-text focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}
function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-brand bg-brand/5 text-brand"
          : "border-line text-text-secondary hover:bg-surface-2 hover:text-text",
      )}
    >
      <Check
        size={13}
        strokeWidth={3}
        className={selected ? "opacity-100" : "opacity-0"}
      />
      {label}
    </button>
  );
}
