import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, GripVertical, Lock, Minus, Pipette, Plus } from "lucide-react";
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
import { partitionSectionOrder } from "../../lib/sectionOrder";
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
  | "header"
  | "font"
  | "fontSize"
  | "sectionHeadings"
  | "colors"
  | "spacing";

const SECTION_CARD =
  "rounded-xl border border-line bg-bg p-4 sm:p-5 md:p-6 space-y-6 scroll-mt-24";
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
  { headingBorder: "line", headingsLine: false },
  { headingBorder: "underline", headingsLine: false },
];

const HEADING_BORDER_LABEL_KEY: Record<Customization["headingBorder"], string> = {
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
  const customization = useResumeStore((s) => s.resume.customization);
  const updateCustomization = useResumeStore((s) => s.updateCustomization);
  const experience = useResumeStore((s) => s.resume.experience);
  const noExperience = useResumeStore((s) => s.resume.noExperience);
  const education = useResumeStore((s) => s.resume.education);
  const skills = useResumeStore((s) => s.resume.skills);
  const languages = useResumeStore((s) => s.resume.languages);
  const references = useResumeStore((s) => s.resume.references);
  const includeReferences = useResumeStore((s) => s.resume.includeReferences);

  // a Section Layout row only appears once the user has actually put
  // something in it — "Experience" also covers Education, since both
  // render under the same heading in ResumePreview's `experience` block
  const sectionHasContent: Record<SectionOrderKey, boolean> = {
    experience: experience.length > 0 || noExperience.length > 0 || education.length > 0,
    skills: skills.length > 0,
    language: languages.length > 0,
    references: includeReferences && references.length > 0,
  };

  const patchToggle = (key: keyof CustomizationToggles) =>
    updateCustomization({
      toggles: { ...customization.toggles, [key]: !customization.toggles[key] },
    });

  // Link Style is a multi-select — any combination of underline/color/icon
  // can be active at once, so picking one toggles it in the set rather
  // than replacing the whole selection
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

  // falls back to empty when an in-memory resume predates the `sidebarKeys`
  // field (e.g. a builder tab left open across a hot-reload)
  const sidebarKeys = customization.sidebarKeys ?? [];

  // moves `dragKey` into `toSidebar`'s column, keeping the rest of
  // sidebarKeys untouched
  const assignSectionColumn = (dragKey: SectionOrderKey, toSidebar: boolean) =>
    toSidebar
      ? sidebarKeys.includes(dragKey)
        ? sidebarKeys
        : [...sidebarKeys, dragKey]
      : sidebarKeys.filter((k) => k !== dragKey);

  // dropping a section onto another row moves it next to that row, and
  // into whichever column that row is currently in
  const dropSectionOnRow = (dragKey: SectionOrderKey, overKey: SectionOrderKey) => {
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

  // dropping on empty column space (not on a specific row) appends the
  // section to the end of that column
  const dropSectionInColumn = (dragKey: SectionOrderKey, toSidebar: boolean) => {
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

  const scrollTo = (key: SectionKey) => {
    // set the active nav item immediately on click, instead of waiting for
    // the scroll-spy observer to catch up once the smooth scroll settles —
    // that lag was making the indicator feel slow/laggy
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
    { key: "header", label: t("builder.customizePage.nav.header") },
    {
      key: "sectionHeadings",
      label: t("builder.customizePage.nav.sectionHeadings"),
    },
    { key: "spacing", label: t("builder.customizePage.nav.spacing") },
  ];

  const { main: mainSectionKeys, sidebar: sidebarSectionKeys } =
    partitionSectionOrder(customization.sectionOrder, customization.sidebarKeys);

  // Text Alignment / Details Arrangement only affect the header when it
  // renders as its own banner (one-column, or two-column with the header
  // pulled to the top) — inside a left/right sidebar it always renders as
  // a narrow left-aligned stack, so those controls would have no visible
  // effect there and are hidden to avoid dead controls
  const headerIsBanner =
    customization.columns === "one" || customization.headerPosition === "top";

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
      <div className="md:hidden sticky top-(--step-bar-height) z-20 -mx-4 mt-4 overflow-x-auto bg-bg will-change-transform">
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
        <div className="hidden md:block w-32 shrink-0 sticky top-(--step-bar-height) self-start">
          <div className="relative flex flex-col gap-1 border-l border-line">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => scrollTo(item.key)}
                className={cn(
                  // whitespace-nowrap keeps every label on one line — a label
                  // wrapping to two lines while its siblings stay single-line
                  // broke the list's even vertical rhythm.
                  // No transition on the active state itself — it should
                  // snap immediately on click rather than slide/lag behind
                  // the smooth scroll to that section.
                  "relative -ml-px whitespace-nowrap text-left text-sm py-2.5 pl-3.5 pr-2 rounded-r-md",
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

          {/* ================= colors ================= */}
          <div ref={colorsRef} data-section="colors" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.colors")}
            </p>

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.colors.layoutMode")}
              </p>
              <div className="grid grid-cols-3 gap-3">
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

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.colors.paletteMode")}
              </p>
              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-4">
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

                <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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

          {/* ================= layout ================= */}
          <div ref={layoutRef} data-section="layout" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.layout")}
            </p>

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
                >
                  <ColumnsPreview columns="two" />
                </OptionCard>
              </div>
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

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-text">
                {t("builder.customizePage.layout.sectionLayout")}
              </p>
              {customization.columns === "two" ? (
                // two-column mode: every section except Personal Details can
                // be dragged into either column — dropping onto a row moves
                // it next to that row (and into that row's column);
                // dropping on empty column space appends it to that column.
                // Header Position "top" pulls Personal Details out of the
                // columns into its own full-width row, mirroring the actual
                // resume where it renders as a banner instead of inside the
                // sidebar (see topHeaderBanner in ResumePreview.tsx)
                <div className="space-y-2.5">
                  {customization.headerPosition === "top" && (
                    <DragRow
                      label={t("builder.customizePage.layout.personalDetails")}
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
                          label={t("builder.customizePage.layout.personalDetails")}
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
                    label={t("builder.customizePage.layout.personalDetails")}
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
              </>
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

          {/* ================= header ================= */}
          <div ref={headerRef} data-section="header" className={SECTION_CARD}>
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.header")}
            </p>

            {headerIsBanner && (
              <>
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
                      label={t("builder.customizePage.header.arrangementInline")}
                      selected={customization.contactArrangement === "inline"}
                      onClick={() =>
                        updateCustomization({ contactArrangement: "inline" })
                      }
                    >
                      <ContactArrangementPreview arrangement="inline" />
                    </OptionCard>
                    <OptionCard
                      label={t("builder.customizePage.header.arrangementStacked")}
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

          {/* ================= section headings ================= */}
          <div
            ref={sectionHeadingsRef}
            data-section="sectionHeadings"
            className={SECTION_CARD}
          >
            <p className={SECTION_TITLE}>
              {t("builder.customizePage.nav.sectionHeadings")}
            </p>

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

/** mini page thumbnail showing the name/title/contact-line block aligned
 *  left vs centered, mirroring HeaderBlock in ResumePreview.tsx */
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

/** mini page thumbnail contrasting a wrapped single-line contact row
 *  ("inline") with a one-per-line list ("stacked") */
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

/** mini page thumbnail contrasting how consecutive contact items are told
 *  apart on the inline row: a leading icon per item, vs. a bullet/bar
 *  divider drawn between items (which drops the icons — see
 *  withContactSeparators in ResumePreview.tsx) */
function ContactSeparatorPreview({
  separator,
}: {
  separator: Customization["contactSeparator"];
}) {
  if (separator === "icon") {
    return (
      <div className={cn(THUMB, "items-center justify-center gap-2.5 px-2")}>
        <div className="flex items-center gap-1">
          <Globe size={9} strokeWidth={2} className="shrink-0 text-text-secondary" />
          <div className="h-1 w-3 rounded-full bg-line" />
        </div>
        <div className="flex items-center gap-1">
          <Globe size={9} strokeWidth={2} className="shrink-0 text-text-secondary" />
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

/** a single glyph rendered exactly as StyledIcon in ResumePreview.tsx would
 *  render it, so the swatch is a true preview and not just an abstract icon.
 *  Reused (at a smaller size) by LinkStylePreview's "icon" option, so that
 *  preview reflects whatever Icon Style the user has actually picked instead
 *  of always showing a bare globe */
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
          <div className="h-px flex-1" style={{ backgroundColor: accentColor }} />
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
          <div className="h-px w-full" style={{ backgroundColor: accentColor }} />
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
        // no width utility here — the parent grid (grid-cols-2/3, sized to
        // that group's option count, same pattern as the Heading Presets
        // grid below) divides the full row width evenly, so every card
        // fills its column edge-to-edge instead of leaving a ragged gap
        // when a row has fewer options than its neighbors
        "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors",
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
      <div className="flex flex-wrap items-center gap-1.5">
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
