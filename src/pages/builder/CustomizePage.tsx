import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Lock, Minus, Pipette, Plus } from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
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
import { FONT_FAMILIES } from "../../lib/fonts";
import { idealTextColor } from "../../lib/color";
import { orderedSidebarKeys } from "../../lib/sectionOrder";
import { cn } from "../../lib/utils";

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
const TEXT_COLORS = ["#171717", "#404040", "#57534E", "#ffffff"];
const BACKGROUND_COLORS = ["#ffffff", "#F8F5F0", "#F3F4F6", "#111827"];
const FONT_SIZE_STEPS = ["small", "medium", "large"] as const;
const FONT_SIZE_PX = { small: "13px", medium: "14.5px", large: "16px" };

type SectionKey =
  | "layout"
  | "font"
  | "fontSize"
  | "sectionHeadings"
  | "colors"
  | "spacing";

const SECTION_CARD =
  "rounded-xl border border-line p-4 md:p-5 space-y-5 scroll-mt-24";
const SECTION_TITLE = "text-sm font-semibold text-brand";

/** quick shortcuts for the heading-style grid: each preset only sets the
 *  border/underline treatment, so it stays independent from the
 *  Capitalization control below — picking a preset never changes case, and
 *  picking a case never changes which preset looks active */
type HeadingPreset = Pick<Customization, "headingBorder"> & {
  headingsLine: boolean;
};

const HEADING_PRESETS: HeadingPreset[] = [
  { headingBorder: "none", headingsLine: true },
  { headingBorder: "none", headingsLine: false },
  { headingBorder: "outline", headingsLine: false },
  { headingBorder: "filled", headingsLine: false },
];

export default function CustomizePage() {
  const { t } = useTranslation();
  const customization = useResumeStore((s) => s.resume.customization);
  const updateCustomization = useResumeStore((s) => s.updateCustomization);

  const patchToggle = (key: keyof CustomizationToggles) =>
    updateCustomization({
      toggles: { ...customization.toggles, [key]: !customization.toggles[key] },
    });

  // ---- section layout drag-and-drop ----
  const [dragSectionKey, setDragSectionKey] = useState<SectionOrderKey | null>(
    null,
  );
  const moveSectionOrder = (dragKey: SectionOrderKey, overKey: SectionOrderKey) => {
    if (dragKey === overKey) return;
    const order = [...customization.sectionOrder];
    const from = order.indexOf(dragKey);
    const to = order.indexOf(overKey);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, dragKey);
    updateCustomization({ sectionOrder: order });
  };

  // ---- section nav + scroll spy ----
  const layoutRef = useRef<HTMLDivElement>(null);
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
    font: fontRef,
    fontSize: fontSizeRef,
    sectionHeadings: sectionHeadingsRef,
    colors: colorsRef,
    spacing: spacingRef,
  };

  const [activeSection, setActiveSection] = useState<SectionKey>("layout");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target.getAttribute("data-section");
        if (top) setActiveSection(top as SectionKey);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (key: SectionKey) =>
    sectionRefs[key].current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  const navItems: { key: SectionKey; label: string }[] = [
    { key: "layout", label: t("builder.customizePage.nav.layout") },
    { key: "font", label: t("builder.customizePage.nav.font") },
    { key: "fontSize", label: t("builder.customizePage.nav.fontSize") },
    {
      key: "sectionHeadings",
      label: t("builder.customizePage.nav.sectionHeadings"),
    },
    { key: "colors", label: t("builder.customizePage.nav.colors") },
    { key: "spacing", label: t("builder.customizePage.nav.spacing") },
  ];

  const fontSizeStepIndex = FONT_SIZE_STEPS.indexOf(customization.fontSize);
  const pageMarginValue = Math.round(
    (customization.topBottomMargin + customization.leftRightMargin) / 2,
  );
  const setPageMargins = (v: number) =>
    updateCustomization({ topBottomMargin: v, leftRightMargin: v });

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

      {/* ---------- section nav: horizontal pills below md, since the
          vertical rail alongside the sections has no room to sit next to
          the single-column content on small screens ---------- */}
      <div className="md:hidden sticky top-(--step-bar-height) z-20 -mx-4 mt-4 overflow-x-auto bg-bg/95 backdrop-blur-sm">
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

      <div className="flex gap-6 items-start mt-4 md:mt-6">
        {/* ---------- section nav (desktop) ---------- */}
        <div className="hidden md:block w-32 shrink-0 sticky top-24 self-start">
          <div className="flex flex-col border-l border-line">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => scrollTo(item.key)}
                className={cn(
                  "text-left text-sm py-2 pl-4 -ml-px border-l-2 transition-colors",
                  activeSection === item.key
                    ? "border-brand text-brand font-medium"
                    : "border-transparent text-text-secondary hover:text-text",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- sections ---------- */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* change templates */}
          <div className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.templates.title")}
            </p>
            <p className="text-xs text-text-secondary -mt-3">
              {t("builder.customizePage.templates.subtitle")}
            </p>
            <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 flex-1 rounded-md bg-bg border border-line shadow-sm"
                />
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-brand text-white text-sm font-medium py-2.5"
            >
              {t("builder.customizePage.templates.button")}
            </button>
          </div>

          {/* ================= layout ================= */}
          <div ref={layoutRef} data-section="layout" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.layout")}
            </p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.columns")}
              </p>
              <div className="flex gap-3">
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
                >
                  <ColumnsPreview columns="two" />
                </OptionCard>
              </div>
            </div>

            {customization.columns === "two" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text">
                  {t("builder.customizePage.layout.headerPosition")}
                </p>
                <div className="flex gap-3">
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.sectionLayout")}
              </p>
              {customization.columns === "two" ? (
                // two-column mode: Skills/References/Language actually move
                // into the sidebar, while Personal Details + Experience stay
                // fixed in the main flow — so the list is split to match,
                // instead of implying everything shares one reorderable flow.
                // The lock icon (via `pinned`) carries that distinction
                // instead of a column-heading label, to keep this compact.
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <DragRow
                      label={t("builder.customizePage.layout.personalDetails")}
                      pinned
                    />
                    <DragRow
                      label={t("builder.customizePage.layout.experience")}
                      pinned
                    />
                  </div>
                  <div className="space-y-2">
                    {orderedSidebarKeys(customization.sectionOrder).map(
                      (key) => (
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
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <DragRow
                    label={t("builder.customizePage.layout.personalDetails")}
                    pinned
                  />
                  {customization.sectionOrder.map((key) => (
                    <DragRow
                      key={key}
                      label={t(`builder.customizePage.layout.${key}`)}
                      draggable
                      onDragStart={() => setDragSectionKey(key)}
                      onDropOn={() => {
                        if (dragSectionKey) moveSectionOrder(dragSectionKey, key);
                        setDragSectionKey(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.showPhoto")}
              </p>
              <Switch
                checked={customization.showPhoto}
                onCheckedChange={(v) => updateCustomization({ showPhoto: v })}
                ariaLabel={t("builder.customizePage.layout.showPhoto")}
              />
            </div>

            {customization.showPhoto && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text">
                    {t("builder.customizePage.layout.photoShape")}
                  </p>
                  <div className="flex gap-3">
                    <OptionCard
                      label={t("builder.customizePage.layout.shapeCircle")}
                      selected={customization.photoShape === "circle"}
                      onClick={() =>
                        updateCustomization({ photoShape: "circle" })
                      }
                    >
                      <div className="size-8 rounded-full bg-line/60" />
                    </OptionCard>
                    <OptionCard
                      label={t("builder.customizePage.layout.shapeRounded")}
                      selected={customization.photoShape === "rounded"}
                      onClick={() =>
                        updateCustomization({ photoShape: "rounded" })
                      }
                    >
                      <div className="size-8 rounded-md bg-line/60" />
                    </OptionCard>
                    <OptionCard
                      label={t("builder.customizePage.layout.shapeSquare")}
                      selected={customization.photoShape === "square"}
                      onClick={() =>
                        updateCustomization({ photoShape: "square" })
                      }
                    >
                      <div className="size-8 bg-line/60" />
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
              </>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.pageFormat")}
              </p>
              <div className="flex gap-3">
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

            <SliderRow
              label={t("builder.customizePage.layout.pageMargins")}
              value={pageMarginValue}
              displayValue={
                pageMarginValue < 12
                  ? t("builder.customizePage.layout.marginsNarrow")
                  : pageMarginValue < 20
                    ? t("builder.customizePage.layout.marginsNormal")
                    : t("builder.customizePage.layout.marginsWide")
              }
              min={6}
              max={30}
              step={1}
              onChange={setPageMargins}
            />
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
              value={fontSizeStepIndex}
              displayValue={FONT_SIZE_PX[customization.fontSize]}
              min={0}
              max={2}
              onChange={(v) =>
                updateCustomization({ fontSize: FONT_SIZE_STEPS[v] })
              }
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

          {/* ================= section headings ================= */}
          <div
            ref={sectionHeadingsRef}
            data-section="sectionHeadings"
            className={SECTION_CARD}
          >
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.sectionHeadings")}
            </p>

            <div className="grid grid-cols-4 gap-3">
              {HEADING_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  title={
                    preset.headingBorder === "filled"
                      ? t("builder.customizePage.sectionHeadings.borderFilled")
                      : preset.headingBorder === "outline"
                        ? t(
                            "builder.customizePage.sectionHeadings.borderOutline",
                          )
                        : t("builder.customizePage.sectionHeadings.borderNone")
                  }
                  onClick={() => applyHeadingPreset(i)}
                  className={cn(
                    "rounded-lg border-2 flex flex-col items-center justify-center gap-2 p-3 transition-colors",
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.capitalization")}
              </p>
              <div className="flex gap-3">
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.sectionHeadings.linkStyle")}
              </p>
              <div className="flex gap-3">
                <OptionCard
                  label={t(
                    "builder.customizePage.sectionHeadings.linkUnderline",
                  )}
                  selected={customization.linkStyle === "underline"}
                  onClick={() =>
                    updateCustomization({ linkStyle: "underline" })
                  }
                />
                <OptionCard
                  label={t("builder.customizePage.sectionHeadings.linkColor")}
                  selected={customization.linkStyle === "color"}
                  onClick={() => updateCustomization({ linkStyle: "color" })}
                />
                <OptionCard
                  label={t("builder.customizePage.sectionHeadings.linkIcon")}
                  selected={customization.linkStyle === "icon"}
                  onClick={() => updateCustomization({ linkStyle: "icon" })}
                />
              </div>
            </div>
          </div>

          {/* ================= colors ================= */}
          <div ref={colorsRef} data-section="colors" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.colors")}
            </p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.colors.layoutMode")}
              </p>
              <div className="flex gap-3">
                <OptionCard
                  label={t("builder.customizePage.colors.layoutFullPage")}
                  selected={customization.colorLayout === "full"}
                  onClick={() => updateCustomization({ colorLayout: "full" })}
                >
                  <HeaderStylePreview mode="full" color={customization.headingBgColor} />
                </OptionCard>
                <OptionCard
                  label={t("builder.customizePage.colors.layoutColumn")}
                  selected={customization.colorLayout === "column"}
                  onClick={() => updateCustomization({ colorLayout: "column" })}
                >
                  <HeaderStylePreview mode="column" color={customization.headingBgColor} />
                </OptionCard>
                <OptionCard
                  label={t("builder.customizePage.colors.layoutBorder")}
                  selected={customization.colorLayout === "border"}
                  onClick={() => updateCustomization({ colorLayout: "border" })}
                >
                  <HeaderStylePreview mode="border" color={customization.headingBgColor} />
                </OptionCard>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.colors.paletteMode")}
              </p>
              <div className="flex gap-3">
                <OptionCard
                  label={t("builder.customizePage.colors.paletteSingle")}
                  selected={customization.paletteMode === "single"}
                  onClick={() => updateCustomization({ paletteMode: "single" })}
                />
                <OptionCard
                  label={t("builder.customizePage.colors.paletteMulti")}
                  selected={customization.paletteMode === "multi"}
                  onClick={() => updateCustomization({ paletteMode: "multi" })}
                />
              </div>
            </div>

            {customization.paletteMode === "single" ? (
              <ColorPicker
                label={t("builder.customizePage.colors.accent")}
                color={customization.accentColor}
                role="accent"
                onChange={(c) => updateCustomization({ accentColor: c })}
              />
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                    {t("builder.customizePage.colors.headingSection")}
                  </p>
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                    <ColorPicker
                      label={t("builder.customizePage.colors.text")}
                      color={customization.headingTextColor}
                      role="text"
                      onChange={(c) =>
                        updateCustomization({ headingTextColor: c })
                      }
                    />
                    <ColorPicker
                      label={t("builder.customizePage.colors.background")}
                      color={customization.headingBgColor}
                      role="background"
                      onChange={(c) =>
                        updateCustomization({ headingBgColor: c })
                      }
                    />
                    <ColorPicker
                      label={t("builder.customizePage.colors.accent")}
                      color={customization.accentColor}
                      role="accent"
                      onChange={(c) => updateCustomization({ accentColor: c })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                    {t("builder.customizePage.colors.bodySection")}
                  </p>
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                    <ColorPicker
                      label={t("builder.customizePage.colors.text")}
                      color={customization.bodyTextColor}
                      role="text"
                      onChange={(c) =>
                        updateCustomization({ bodyTextColor: c })
                      }
                    />
                    <ColorPicker
                      label={t("builder.customizePage.colors.background")}
                      color={customization.bodyBgColor}
                      role="background"
                      onChange={(c) => updateCustomization({ bodyBgColor: c })}
                    />
                    <ColorPicker
                      label={t("builder.customizePage.colors.accent")}
                      color={customization.bodyAccentColor}
                      role="accent"
                      onChange={(c) =>
                        updateCustomization({ bodyAccentColor: c })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {(
                Object.keys(
                  customization.toggles,
                ) as (keyof CustomizationToggles)[]
              ).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-text cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={customization.toggles[key]}
                    onChange={() => patchToggle(key)}
                    className="size-4 accent-brand rounded"
                  />
                  {t(`builder.customizePage.colors.toggles.${key}`)}
                </label>
              ))}
            </div>
          </div>

          {/* ================= spacing ================= */}
          <div ref={spacingRef} data-section="spacing" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.spacing")}
            </p>
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
          </div>
        </div>
      </div>
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

/** mini page thumbnail: one flowing column of text, or a narrow content
 *  column beside a wider one — mirrors the actual resume layout */
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

/** mini page thumbnail highlighting where the header band sits */
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

/** mini page thumbnail showing how the heading color paints the page for
 *  each "Header style" option. Built on THUMB, which always keeps a neutral
 *  border/frame — so the shape stays legible even when the picked color is
 *  white (a real case, since white is the customization default). */
function HeaderStylePreview({
  mode,
  color,
}: {
  mode: "full" | "column" | "border";
  color: string;
}) {
  if (mode === "full") {
    const lineColor = idealTextColor(color);
    return (
      <div className={THUMB} style={{ backgroundColor: color }}>
        <div className="flex-1 min-w-0 min-h-0 flex flex-col justify-center gap-1">
          <div
            className="h-1 w-4/5 rounded-full"
            style={{ backgroundColor: lineColor, opacity: 0.55 }}
          />
          <div
            className="h-1 w-3/5 rounded-full"
            style={{ backgroundColor: lineColor, opacity: 0.55 }}
          />
        </div>
      </div>
    );
  }
  if (mode === "column") {
    return (
      <div className={THUMB}>
        <div
          className="w-[30%] shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0 rounded-sm bg-surface-2 flex flex-col justify-center gap-1 px-1.5">
          <div className="h-1 w-full rounded-full bg-line" />
          <div className="h-1 w-2/3 rounded-full bg-line" />
        </div>
      </div>
    );
  }
  return (
    <div className={THUMB} style={{ boxShadow: `inset 0 0 0 3px ${color}` }}>
      <div className="flex-1 min-w-0 min-h-0 flex flex-col justify-center gap-1">
        <div className="h-1 w-4/5 rounded-full bg-line" />
        <div className="h-1 w-3/5 rounded-full bg-line" />
      </div>
    </div>
  );
}

/** mirrors the real Section heading's border/fill/underline + text-case
 *  rules (see Section() in ResumePreview.tsx) at a miniature scale, using
 *  the resume's actual accent color — so each preset shows exactly what
 *  it will look like, not just an abstract shape */
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

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span
        className={cn(
          "text-[8px] font-bold leading-none tracking-[0.15em]",
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
      <div className="flex w-full flex-col items-center gap-1">
        <div className="h-1 w-full rounded-full bg-line/70" />
        <div className="h-1 w-2/3 rounded-full bg-line/70" />
      </div>
    </div>
  );
}

function OptionCard({
  label,
  selected,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors",
        selected ? "border-brand bg-brand/5" : "border-line hover:bg-surface-2",
      )}
    >
      {children}
      <span
        className={cn(
          "text-xs font-medium",
          selected ? "text-brand" : "text-text-secondary",
        )}
      >
        {label}
      </span>
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
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text">{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={decrease}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="flex size-6 items-center justify-center rounded-md border border-line text-text-secondary transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={12} />
          </button>
          <span className="min-w-[3.5ch] text-center font-medium text-brand">
            {displayValue}
          </span>
          <button
            type="button"
            onClick={increase}
            disabled={value >= max}
            aria-label={`Increase ${label}`}
            className="flex size-6 items-center justify-center rounded-md border border-line text-text-secondary transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
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
  /** always-first row (Personal Details) — shown but not reorderable */
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
      onDrop={onDropOn}
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

type SwatchRole = "text" | "background" | "accent";

const SWATCH_PRESETS: Record<SwatchRole, string[]> = {
  text: TEXT_COLORS,
  background: BACKGROUND_COLORS,
  accent: ACCENT_COLORS,
};

/** a labeled row of preset swatches for a single color field, plus a
 *  "custom" swatch that opens the native picker — replaces the old
 *  ColorDot/AccentDot split so every color field looks and behaves the
 *  same, whether it's normally picked from a preset or a one-off hex */
function ColorPicker({
  label,
  color,
  role,
  onChange,
}: {
  label: string;
  color: string;
  role: SwatchRole;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const presets = SWATCH_PRESETS[role];
  const isCustom = !presets.some(
    (p) => p.toLowerCase() === color.toLowerCase(),
  );

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-text-secondary">{label}</span>
      <div className="flex items-center gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={preset}
            className={cn(
              "size-6 shrink-0 rounded-full border transition-transform hover:scale-110",
              color.toLowerCase() === preset.toLowerCase()
                ? "border-brand ring-2 ring-brand ring-offset-2 ring-offset-bg"
                : "border-line",
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
        <label
          className={cn(
            "relative flex size-6 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border",
            isCustom
              ? "border-brand ring-2 ring-brand ring-offset-2 ring-offset-bg"
              : "border-dashed border-line",
          )}
          style={isCustom ? { backgroundColor: color } : undefined}
          title={t("builder.customizePage.colors.custom")}
        >
          {!isCustom && <Pipette size={11} className="text-text-secondary" />}
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
