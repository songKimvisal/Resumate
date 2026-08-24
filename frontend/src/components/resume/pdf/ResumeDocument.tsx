import { Fragment } from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Rect,
} from "@react-pdf/renderer";
import { extraExperienceTitle } from "../../../lib/experienceDisplay";
import { orderedExperienceEntries } from "../../../lib/experienceOrder";
import {
  LANGUAGE_LEVEL_LABELS,
  SKILL_LEVEL_LABELS,
  type Customization,
  type EducationItem,
  type ExperienceItem,
  type LayoutVariant,
  type LinkItem,
  type PersonalInfo,
  type Resume,
} from "../../../types/resume";
import { idealTextColor } from "../../../lib/color";
import { richTextToPdf, hasVisibleText } from "../../../lib/richTextToPdf";
import { pdfFontFamily, pdfFontVariants } from "../../../lib/fonts";
import { marginPercentPdf } from "../../../lib/pageSize";
import {
  orderedMainGroups,
  orderedSidebarKeys,
} from "../../../lib/sectionOrder";
import { SpecialPdfDocument } from "./SpecialPdfLayouts";

function isSpecialLayout(variant: LayoutVariant | undefined) {
  return !!variant && variant !== "default";
}

// PDF points render smaller than browser px for the same visual size on the
// page; this ratio keeps the exported PDF matching the live preview (it's
// the small/medium/large -> 9/10/11pt mapping this replaced, as a ratio).
const PDF_FONT_SIZE_RATIO = 10 / 14.5;
// the live preview measures the page in CSS px (96/inch); PDF pages are laid
// out in points (72/inch) — this keeps a border set to Npx look the same
// physical thickness in the exported PDF as it does in the preview.
const PDF_PX_TO_PT = 72 / 96;
function fmtDate(
  value: string,
  format: Customization["dateFormat"] = "monthYear",
) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  if (format === "yearOnly") return `${y}`;
  if (format === "numeric") return `${String(m).padStart(2, "0")}/${y}`;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function dateRange(
  item: Pick<
    ExperienceItem | EducationItem,
    "startDate" | "endDate" | "current"
  >,
  format?: Customization["dateFormat"],
) {
  if (!item.startDate && !item.endDate && !item.current) return "";
  const end = item.current ? "Present" : fmtDate(item.endDate, format);
  return `${fmtDate(item.startDate, format)} – ${end}`;
}

function photoRadius(shape: Customization["photoShape"], size: number) {
  if (shape === "circle") return size / 2;
  if (shape === "rounded") return size * 0.16;
  return 0;
}

/** percent of the page width the sidebar column occupies, when present */
const SIDEBAR_WIDTH_PCT = 34;

/** react-pdf has no CSS aspect-ratio support, so the full-bleed sidebar
 *  photo needs an explicit point value instead — close enough across
 *  A4/Letter that the difference is imperceptible */
const FULL_BLEED_PHOTO_HEIGHT_PT = 190;

/* ---------------------------------------------------------------------
 * contact icons — react-pdf can't render DOM/lucide-react icons, so the
 * handful used in the header/sidebar contact rows are reproduced here as
 * raw path data (lucide-react's own source, 24x24 viewBox) drawn through
 * @react-pdf/renderer's Svg primitives.
 * ------------------------------------------------------------------- */
type IconKey =
  | "phone"
  | "mail"
  | "pin"
  | "flag"
  | "briefcase"
  | "globe"
  | "linkedin"
  | "github"
  | "gitlab"
  | "stackoverflow"
  | "send"
  | "id"
  | "fileText"
  | "graduationCap"
  | "sparkles"
  | "languages"
  | "users"
  | "link";

type IconShape =
  | { type: "path"; d: string }
  | { type: "circle"; cx: string; cy: string; r: string }
  | {
      type: "rect";
      x: string;
      y: string;
      width: string;
      height: string;
      rx?: string;
    };

const ICON_SHAPES: Record<IconKey, IconShape[]> = {
  phone: [
    {
      type: "path",
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
    },
  ],
  mail: [
    { type: "path", d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" },
    { type: "rect", x: "2", y: "4", width: "20", height: "16", rx: "2" },
  ],
  pin: [
    {
      type: "path",
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
    },
    { type: "circle", cx: "12", cy: "10", r: "3" },
  ],
  flag: [
    {
      type: "path",
      d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
    },
  ],
  briefcase: [
    { type: "path", d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
    { type: "rect", x: "2", y: "6", width: "20", height: "14", rx: "2" },
  ],
  globe: [
    { type: "circle", cx: "12", cy: "12", r: "10" },
    { type: "path", d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" },
    { type: "path", d: "M2 12h20" },
  ],
  linkedin: [
    { type: "path", d: "M16 2v2" },
    { type: "path", d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" },
    { type: "path", d: "M8 2v2" },
    { type: "circle", cx: "12", cy: "11", r: "3" },
    { type: "rect", x: "3", y: "4", width: "18", height: "18", rx: "2" },
  ],
  github: [
    { type: "path", d: "m10 9-3 3 3 3" },
    { type: "path", d: "m14 15 3-3-3-3" },
    { type: "rect", x: "3", y: "3", width: "18", height: "18", rx: "2" },
  ],
  gitlab: [
    { type: "path", d: "M15 6a9 9 0 0 0-9 9V3" },
    { type: "circle", cx: "18", cy: "6", r: "3" },
    { type: "circle", cx: "6", cy: "18", r: "3" },
  ],
  stackoverflow: [
    {
      type: "path",
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
    },
  ],
  send: [
    {
      type: "path",
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
    },
    { type: "path", d: "m21.854 2.147-10.94 10.939" },
  ],
  id: [
    { type: "path", d: "M16 10h2" },
    { type: "path", d: "M16 14h2" },
    { type: "path", d: "M6.17 15a3 3 0 0 1 5.66 0" },
    { type: "circle", cx: "9", cy: "11", r: "2" },
    { type: "rect", x: "2", y: "5", width: "20", height: "14", rx: "2" },
  ],
  fileText: [
    {
      type: "path",
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
    },
    { type: "path", d: "M14 2v5a1 1 0 0 0 1 1h5" },
    { type: "path", d: "M10 9H8" },
    { type: "path", d: "M16 13H8" },
    { type: "path", d: "M16 17H8" },
  ],
  graduationCap: [
    {
      type: "path",
      d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
    },
    { type: "path", d: "M22 10v6" },
    { type: "path", d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" },
  ],
  sparkles: [
    {
      type: "path",
      d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
    },
    { type: "path", d: "M20 2v4" },
    { type: "path", d: "M22 4h-4" },
    { type: "circle", cx: "4", cy: "20", r: "2" },
  ],
  languages: [
    { type: "path", d: "m5 8 6 6" },
    { type: "path", d: "m4 14 6-6 2-3" },
    { type: "path", d: "M2 5h12" },
    { type: "path", d: "M7 2h1" },
    { type: "path", d: "m22 22-5-10-5 10" },
    { type: "path", d: "M14 18h6" },
  ],
  users: [
    { type: "path", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
    { type: "path", d: "M16 3.128a4 4 0 0 1 0 7.744" },
    { type: "path", d: "M22 21v-2a4 4 0 0 0-3-3.87" },
    { type: "circle", cx: "9", cy: "7", r: "4" },
  ],
  link: [
    {
      type: "path",
      d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    },
    {
      type: "path",
      d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    },
  ],
};

function PdfIcon({
  icon,
  size,
  color,
}: {
  icon: IconKey;
  size: number;
  color: string;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {ICON_SHAPES[icon].map((shape, i) =>
        shape.type === "circle" ? (
          <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...stroke} />
        ) : shape.type === "rect" ? (
          <Rect
            key={i}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={shape.rx}
            {...stroke}
          />
        ) : (
          <Path key={i} d={shape.d} {...stroke} />
        ),
      )}
    </Svg>
  );
}

/** maps each Section's literal title to its icon key, mirroring
 *  SECTION_ICONS in ResumePreview.tsx */
const SECTION_ICON_KEYS: Record<string, IconKey> = {
  Summary: "fileText",
  Experience: "briefcase",
  Education: "graduationCap",
  Skills: "sparkles",
  Languages: "languages",
  References: "users",
};

/** renders a Section heading's icon per the "Section icon" pick, mirroring
 *  SectionHeadingIcon in ResumePreview.tsx: "outline" is a bare glyph
 *  colored to match the heading text, "filled" is a solid circular badge
 *  that inverts when the heading itself already sits on a solid accent
 *  background (headingBorder "filled"), so it doesn't disappear into it */
function SectionPdfIcon({
  iconKey,
  size,
  accent,
  onAccentBg,
  sectionIcon,
}: {
  iconKey: IconKey;
  size: number;
  accent: string;
  onAccentBg: boolean;
  sectionIcon: Customization["sectionIcon"];
}) {
  const isFilled = sectionIcon === "filled";
  // "filled"'s bg/icon are an inverted pair for contrast; "outline" has no
  // fill, so its border and icon both just take the "ink" color (white on
  // an accent-filled heading, accent otherwise) — mirrors SectionHeadingIcon
  // in ResumePreview.tsx
  const badgeBg = onAccentBg ? "#fff" : accent;
  const filledIconColor = onAccentBg ? accent : "#fff";
  const boxSize = size * 1.5;
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: boxSize / 2,
        backgroundColor: isFilled ? badgeBg : undefined,
        borderWidth: isFilled ? 0 : 1.5,
        borderColor: isFilled ? undefined : badgeBg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PdfIcon
        icon={iconKey}
        size={size * 0.85}
        color={isFilled ? filledIconColor : badgeBg}
      />
    </View>
  );
}

/** wraps PdfIcon per the "Icon Style" pick, mirroring StyledIcon in
 *  ResumePreview.tsx so the exported PDF matches the live preview */
function StyledPdfIcon({
  icon,
  size,
  color,
  accent,
  accentText,
  iconStyle,
}: {
  icon: IconKey;
  size: number;
  color: string;
  accent: string;
  /** contrast-safe stand-in for `accent` used as ink (border/glyph) instead
   *  of fill — see the comment on `accentText` in ResumeDocument's main
   *  render function */
  accentText: string;
  iconStyle: Customization["iconStyle"];
}) {
  if (iconStyle === "faded") {
    return (
      <View style={{ opacity: 0.5 }}>
        <PdfIcon icon={icon} size={size} color={color} />
      </View>
    );
  }
  if (iconStyle === "plain") {
    return <PdfIcon icon={icon} size={size} color={color} />;
  }
  const isFilled = iconStyle === "filled" || iconStyle === "square";
  const boxSize = size * 1.7;
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: iconStyle === "square" ? boxSize * 0.2 : boxSize / 2,
        backgroundColor: isFilled ? accent : undefined,
        borderWidth: isFilled ? 0 : 1,
        borderColor: isFilled ? undefined : accentText,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PdfIcon
        icon={icon}
        size={size * 0.85}
        color={isFilled ? "#fff" : accentText}
      />
    </View>
  );
}

interface ContactItem {
  key: string;
  icon: IconKey;
  text: string;
  url?: string;
  /** header-type fields (phone/email/location/...) are governed by the
   *  "Header icons" toggle; link-type fields (portfolio/website/...) by
   *  "Link icons" (or linkStyle "icon") — mirrors contactItems() in
   *  ResumePreview.tsx */
  isHeader: boolean;
}

function buildContactItems(personal: PersonalInfo): ContactItem[] {
  const items: ContactItem[] = [];
  const pushHeader = (key: string, icon: IconKey, text: string) => {
    if (text) items.push({ key, icon, text, isHeader: true });
  };
  const pushLinks = (icon: IconKey, entries: LinkItem[]) => {
    entries.forEach((entry) => {
      if (entry.title.trim()) {
        items.push({
          key: entry.id,
          icon,
          text: entry.title,
          url: entry.url || undefined,
          isHeader: false,
        });
      }
    });
  };
  pushHeader("phone", "phone", personal.phone);
  pushHeader("email", "mail", personal.email);
  pushHeader("location", "pin", personal.location);
  pushHeader("nationality", "flag", personal.nationality);
  pushLinks("briefcase", personal.portfolio);
  pushLinks("globe", personal.website);
  pushLinks("linkedin", personal.linkedin);
  pushLinks("github", personal.github);
  pushLinks("gitlab", personal.gitlab);
  pushLinks("stackoverflow", personal.stackoverflow);
  pushLinks("send", personal.telegram);
  pushHeader("passport", "id", personal.passportId);
  return items;
}
function ContactRow({
  items,
  c,
  accent,
  accentText,
  color,
  fontSize,
  variant,
}: {
  items: ContactItem[];
  c: Customization;
  accent: string;
  accentText: string;
  color: string;
  fontSize: number;
  variant: "row" | "column";
}) {
  if (items.length === 0) return null;
  const showLinkIcons = c.toggles.linkIcons || c.linkStyle.includes("icon");

  const linkStyle = {
    textDecoration: c.linkStyle.includes("underline")
      ? ("underline" as const)
      : ("none" as const),
    color: c.linkStyle.includes("color") ? accentText : color,
  };

  const rowStacked = variant === "row" && c.contactArrangement === "stacked";
  const useSeparator =
    variant === "row" && !rowStacked && c.contactSeparator !== "icon";
  const separatorGlyph = c.contactSeparator === "bullet" ? "•" : "|";
  return (
    <View
      style={
        rowStacked
          ? {
              flexDirection: "column",
              rowGap: 3,
              marginTop: 6,
              alignItems:
                c.headerAlignment === "left" ? "flex-start" : "center",
            }
          : variant === "row"
            ? {
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent:
                  c.headerAlignment === "left" ? "flex-start" : "center",
                columnGap: 12,
                rowGap: 2,
                marginTop: 6,
              }
            : {
                flexDirection: "column",
                rowGap: 3,
                marginTop: 3,
                alignItems: "flex-start",
              }
      }
    >
      {items.map((item, i) => {
        const showIcon =
          !useSeparator &&
          (item.isHeader ? c.toggles.headerIcons : showLinkIcons);
        return (
          <Fragment key={item.key}>
            {useSeparator && i > 0 && (
              <Text style={{ fontSize, color, opacity: 0.5 }}>
                {separatorGlyph}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                columnGap: 3,
              }}
            >
              {showIcon && (
                <StyledPdfIcon
                  icon={item.icon}
                  size={fontSize}
                  color={color}
                  accent={accent}
                  accentText={accentText}
                  iconStyle={c.iconStyle}
                />
              )}
              <Text style={{ fontSize, color }}>
                {item.url ? (
                  <Link src={item.url} style={linkStyle}>
                    {item.text}
                  </Link>
                ) : (
                  item.text
                )}
              </Text>
              {c.linkStyle.includes("icon") && item.url && (
                <PdfIcon icon="link" size={fontSize * 0.8} color={color} />
              )}
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}
export function ResumeDocument({ resume }: { resume: Resume }) {
  if (isSpecialLayout(resume.customization.layoutVariant)) {
    return <SpecialPdfDocument resume={resume} />;
  }

  const {
    personal,
    experience,
    noExperience,
    experienceOrder,
    education,
    skills,
    languages,
    references,
    includeReferences,
    customization: c,
  } = resume;
  const mixedExperience = orderedExperienceEntries({
    experience,
    noExperience,
    experienceOrder,
  });
  const accent = c.accentColor;
  const base = c.fontSize * PDF_FONT_SIZE_RATIO;
  const fontFamily = pdfFontFamily(c.fontFamily);
  const variants = pdfFontVariants(fontFamily);

  const gapSection = c.elementSpacing * (14 / 12);
  const gapEntry = c.elementSpacing * (8 / 12);

  const marginVerticalPct = marginPercentPdf(
    c.topBottomMargin,
    "vertical",
    c.pageFormat,
  );
  const marginHorizontalPct = marginPercentPdf(
    c.leftRightMargin,
    "horizontal",
    c.pageFormat,
  );

  const hasSidebar = c.columns === "two";
  const headerInSidebar = hasSidebar && c.headerPosition !== "top";
  const listsInSidebar = hasSidebar;
  const sidebarSide: "left" | "right" = headerInSidebar
    ? (c.headerPosition as "left" | "right")
    : "left";

  const bodyTextColorEff = c.bodyTextColor;
  const bodyAccentColorEff = c.accentColor;
  const accentText = accent;
  const headingsInk = c.toggles.headings ? accentText : bodyTextColorEff;
  const headingsFill = c.toggles.headings ? accent : bodyTextColorEff;
  const datesAccent = c.toggles.dates ? bodyAccentColorEff : bodyTextColorEff;
  const sidebarInk = c.sidebarBgColor
    ? idealTextColor(c.sidebarBgColor)
    : bodyTextColorEff;
  const sidebarHeadingsInk = c.sidebarBgColor
    ? c.toggles.headings
      ? accentText
      : sidebarInk
    : headingsInk;

  const headerTextColor =
    headerInSidebar && c.sidebarBgColor ? sidebarInk : c.bodyTextColor;
  const pageBackgroundColor = c.bodyBgColor;
  const fullNameAccent = c.toggles.fullName ? accentText : headerTextColor;
  const jobTitleAccent = c.toggles.jobTitle ? accentText : headerTextColor;

  const isFilled = c.headingBorder === "filled";
  const isOutline = c.headingBorder === "outline";
  const isLongLine = c.headingBorder === "line";
  const isLongUnderline = c.headingBorder === "underline";

  const styles = StyleSheet.create({
    // NOTE: `lineHeight` is only ever set alongside an explicit `fontSize`
    // on the same style object. @react-pdf/renderer doesn't recompute an
    // inherited lineHeight as a multiplier of each descendant's own font
    // size — it reuses the literal inherited value as an absolute line-box
    // height, which collapses larger text (e.g. the name) into an overlap.
    page: {
      paddingVertical: `${marginVerticalPct}%`,
      paddingLeft: `${hasSidebar && sidebarSide === "left" ? marginHorizontalPct + SIDEBAR_WIDTH_PCT : marginHorizontalPct}%`,
      paddingRight: `${hasSidebar && sidebarSide === "right" ? marginHorizontalPct + SIDEBAR_WIDTH_PCT : marginHorizontalPct}%`,
      fontSize: base,
      fontFamily: variants.regular,
      color: bodyTextColorEff,
      backgroundColor: pageBackgroundColor,
    },
    pageBorderFrame: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderWidth: c.pageBorder ? c.pageBorderWidth * PDF_PX_TO_PT : 0,
      borderColor: accent,
      borderStyle: "solid",
    },
    sidebarBand: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: `${SIDEBAR_WIDTH_PCT}%`,
      backgroundColor: c.sidebarBgColor || pageBackgroundColor,
      ...(sidebarSide === "left" ? { left: 0 } : { right: 0 }),
    },
    sidebarPhoto: {
      position: "absolute",
      top: 0,
      width: `${SIDEBAR_WIDTH_PCT}%`,
      height: FULL_BLEED_PHOTO_HEIGHT_PT,
      objectFit: "cover",
      ...(sidebarSide === "left" ? { left: 0 } : { right: 0 }),
    },
    topAccentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "30%",
      height: 10,
      backgroundColor: accent,
    },
    footerBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 10,
      backgroundColor: c.sidebarBgColor || "#1F2937",
    },
    sidebarContent: {
      position: "absolute",
      top: 0,
      width: `${SIDEBAR_WIDTH_PCT}%`,
      paddingVertical: `${marginVerticalPct}%`,
      paddingHorizontal: `${marginHorizontalPct}%`,
      alignItems: "center",
      ...(sidebarSide === "left" ? { left: 0 } : { right: 0 }),
    },
    sidebarSection: { marginTop: gapSection, alignSelf: "stretch" },
    header: {
      alignItems: c.headerAlignment === "left" ? "flex-start" : "center",
      marginBottom: gapSection,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: gapSection,
    },
    photo: {
      width: c.photoSize * 0.8,
      height: c.photoSize * 0.8,
      borderRadius: photoRadius(c.photoShape, c.photoSize * 0.8),
      marginBottom: 8,
      objectFit: "cover",
      borderWidth: c.photoBorder ? 1.5 : 0,
      borderColor: accent,
      borderStyle: "solid",
    },
    photoRow: {
      width: c.photoSize * 0.8,
      height: c.photoSize * 0.8,
      borderRadius: photoRadius(c.photoShape, c.photoSize * 0.8),
      marginRight: 14,
      objectFit: "cover",
      borderWidth: c.photoBorder ? 1.5 : 0,
      borderColor: accent,
      borderStyle: "solid",
    },
    name: {
      fontSize: c.fullNameSize,
      fontFamily: variants.bold,
      color: fullNameAccent,
      lineHeight: c.lineHeight,
    },
    jobTitle: {
      fontSize: c.titleSize,
      fontFamily: variants.bold,
      marginTop: 2,
      color: jobTitleAccent,
      lineHeight: c.lineHeight,
    },
    section: { marginTop: gapSection },
    sectionTitle: {
      fontSize: c.headingsSize,
      fontFamily: variants.bold,
      textTransform: c.capitalization,
      letterSpacing: 1.5 + c.headingsLetterSpacing,
      paddingBottom: isOutline || isFilled ? 0 : 3,
      marginBottom: 6,
      alignSelf: "flex-start",
      color: isFilled ? "#ffffff" : headingsInk,
      backgroundColor: isFilled ? headingsFill : undefined,
      borderColor: headingsInk,
      borderBottomWidth:
        !isOutline &&
        !isFilled &&
        !isLongLine &&
        !isLongUnderline &&
        c.toggles.headingsLine
          ? 1
          : 0,
      borderWidth: isOutline ? 1 : 0,
      paddingHorizontal: isOutline || isFilled ? 6 : 0,
      paddingTop: isOutline || isFilled ? 2 : 0,
      borderRadius: isFilled ? 3 : 0,
      lineHeight: 1.2,
    },
    entry: { marginTop: gapEntry },
    entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: {
      fontSize: base * 0.95,
      fontFamily: variants.bold,
      color: bodyTextColorEff,
      lineHeight: c.lineHeight,
    },
    entryMeta: { fontFamily: variants.regular, color: bodyAccentColorEff },
    entryDates: {
      fontSize: base * 0.78,
      color: datesAccent,
      lineHeight: c.lineHeight,
    },
    entrySubtitle: {
      fontSize: base * 0.85,
      color: bodyAccentColorEff,
      marginTop: 1,
      lineHeight: c.lineHeight,
    },
    twoCol: { flexDirection: "row", marginTop: gapSection, gap: 24 },
    twoColRow: { flexDirection: "row", gap: 24, marginTop: 2 },
    col: { flex: 1, minWidth: 0 },
    dotRow: { flexDirection: "row", gap: 3, alignItems: "center" },
    dot: { width: 5, height: 5, borderRadius: 2.5 },
  });

  const contactItems = buildContactItems(personal);

  const richTextOpts = {
    fontFamily,
    lineHeight: c.lineHeight,
    bulletStyle: c.bulletStyle,
  };
  const showPhoto = c.showPhoto && !!personal.photoUrl;
  const showFullBleedPhoto = headerInSidebar && c.sidebarPhotoFill && showPhoto;
  const renderSectionTitle = (
    title: string,
    extraStyle?: { alignSelf?: "flex-start" },
    inkOverride?: string,
  ) => {
    const ink = inkOverride ?? headingsInk;
    const iconKey = SECTION_ICON_KEYS[title];
    const showIcon = c.sectionIcon !== "none" && !!iconKey;
    const icon = showIcon ? (
      <SectionPdfIcon
        iconKey={iconKey}
        size={c.headingsSize}
        accent={headingsFill}
        onAccentBg={isFilled}
        sectionIcon={c.sectionIcon}
      />
    ) : null;

    if (isLongLine) {
      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
            columnGap: 6,
          }}
        >
          {icon}
          <Text style={[styles.sectionTitle, { marginBottom: 0, color: ink }]}>
            {title}
          </Text>
          <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: ink }} />
        </View>
      );
    }
    if (isLongUnderline) {
      return (
        <View style={{ marginBottom: 6 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", columnGap: 4 }}
          >
            {icon}
            <Text
              style={[styles.sectionTitle, { marginBottom: 0, color: ink }]}
            >
              {title}
            </Text>
          </View>
          <View
            style={{
              marginTop: 3,
              borderTopWidth: 1,
              borderTopColor: ink,
              width: "100%",
            }}
          />
        </View>
      );
    }
    if (!showIcon) {
      return (
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isFilled ? styles.sectionTitle.color : ink,
              borderColor: ink,
            },
            ...(extraStyle ? [extraStyle] : []),
          ]}
        >
          {title}
        </Text>
      );
    }
    return (
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            columnGap: 4,
            alignSelf: styles.sectionTitle.alignSelf,
            backgroundColor: styles.sectionTitle.backgroundColor,
            borderColor: ink,
            borderWidth: styles.sectionTitle.borderWidth,
            borderRadius: styles.sectionTitle.borderRadius,
            paddingHorizontal: styles.sectionTitle.paddingHorizontal,
            paddingTop: styles.sectionTitle.paddingTop,
            paddingBottom: styles.sectionTitle.paddingBottom,
            borderBottomWidth: styles.sectionTitle.borderBottomWidth,
            marginBottom: styles.sectionTitle.marginBottom,
          },
          ...(extraStyle ? [extraStyle] : []),
        ]}
      >
        {icon}
        <Text
          style={{
            fontSize: styles.sectionTitle.fontSize,
            fontFamily: styles.sectionTitle.fontFamily,
            textTransform: styles.sectionTitle.textTransform,
            letterSpacing: styles.sectionTitle.letterSpacing,
            color: isFilled ? styles.sectionTitle.color : ink,
            lineHeight: styles.sectionTitle.lineHeight,
          }}
        >
          {title}
        </Text>
      </View>
    );
  };

  const renderLevels = (
    items: { id: string; name: string; level: number }[],
    labels: readonly string[],
    inkOverride?: string,
  ) => {
    const ink = inkOverride ?? bodyTextColorEff;
    if (c.skillsDisplay === "list") {
      return (
        <View>
          {items
            .filter((i) => i.name)
            .map((i) => (
              <View
                key={i.id}
                wrap={false}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 4,
                  marginTop: 2,
                }}
              >
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: accent,
                  }}
                />
                <Text style={{ fontSize: base * 0.85, color: ink }}>
                  {i.name}
                </Text>
              </View>
            ))}
        </View>
      );
    }
    return c.toggles.dots ? (
      <View>
        {items
          .filter((i) => i.name)
          .map((i) => (
              <View
                key={i.id}
                wrap={false}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 2,
                }}
              >
              <Text style={{ fontSize: base * 0.85, color: ink }}>
                {i.name}
              </Text>
              <View style={styles.dotRow}>
                {Array.from({ length: 5 }).map((_, d) => (
                  <View
                    key={d}
                    style={[
                      styles.dot,
                      d < i.level
                        ? { backgroundColor: accent }
                        : { backgroundColor: ink, opacity: 0.2 },
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
      </View>
    ) : (
      <Text style={{ fontSize: base * 0.85, color: ink }}>
        {items
          .map((i) => (i.name ? `${i.name} (${labels[i.level - 1]})` : ""))
          .filter(Boolean)
          .join("  ·  ")}
      </Text>
    );
  };

  // self-contained per-entry dot + short line — deliberately NOT a
  // continuous line across entries, since entries can land on different
  // auto-paginated pages
  const timelineWrap = (node: React.ReactNode) =>
    c.toggles.timeline ? (
      <View style={{ position: "relative", paddingLeft: 10 }}>
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 3,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: accent,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 2,
            top: 8,
            width: 1,
            height: 14,
            backgroundColor: accent,
            opacity: 0.35,
          }}
        />
        {node}
      </View>
    ) : (
      node
    );

  // experience/education, skills+languages, and references render as
  // independent groups here, then get concatenated below in whatever order
  // `sectionOrder` specifies (mirrors ResumePreview.tsx's block grouping)
  const expEduNode = (
    <>
      {(experience.length > 0 || noExperience.length > 0) && (
        <View style={styles.section} minPresenceAhead={40}>
          {renderSectionTitle("Experience")}
          {mixedExperience.map((entry) =>
            entry.kind === "job" ? (
            <View key={entry.item.id} style={styles.entry} minPresenceAhead={28}>
              {timelineWrap(
                <View style={styles.entryHeaderRow} wrap={false}>
                  <Text style={styles.entryTitle}>
                    {entry.item.jobTitle || "Job title"}
                    {(entry.item.company || entry.item.location) && (
                      <Text style={styles.entryMeta}>
                        {" "}
                        -{" "}
                        {[entry.item.company, entry.item.location]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.entryDates}>
                    {dateRange(entry.item, c.dateFormat)}
                  </Text>
                </View>,
              )}
              {hasVisibleText(entry.item.description) &&
                richTextToPdf(entry.item.description, {
                  fontSize: base * 0.85,
                  color: bodyTextColorEff,
                  ...richTextOpts,
                })}
            </View>
            ) : (
            <View key={entry.item.id} style={styles.entry} minPresenceAhead={28}>
              {timelineWrap(
                <View style={styles.entryHeaderRow} wrap={false}>
                  <Text style={styles.entryTitle}>
                    {entry.item.url.trim() ? (
                      <Link
                        src={entry.item.url}
                        style={{
                          textDecoration: c.linkStyle.includes("underline")
                            ? ("underline" as const)
                            : ("none" as const),
                          color: c.linkStyle.includes("color")
                            ? accentText
                            : bodyAccentColorEff,
                        }}
                      >
                        {extraExperienceTitle(entry.item)}
                      </Link>
                    ) : (
                      extraExperienceTitle(entry.item)
                    )}
                    {entry.item.subtitle ? (
                      <Text style={styles.entryMeta}>
                        {" "}
                        - {entry.item.subtitle}
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={styles.entryDates}>
                    {dateRange(entry.item, c.dateFormat)}
                  </Text>
                </View>,
              )}
              {hasVisibleText(entry.item.description) &&
                richTextToPdf(entry.item.description, {
                  fontSize: base * 0.85,
                  color: bodyTextColorEff,
                  ...richTextOpts,
                })}
            </View>
            ),
          )}
        </View>
      )}

      {education.length > 0 && (
        <View style={styles.section} minPresenceAhead={40}>
          {renderSectionTitle("Education")}
          {education.map((edu) => (
            <View key={edu.id} style={styles.entry} minPresenceAhead={28}>
              <View style={styles.entryHeaderRow} wrap={false}>
                <View>
                  <Text style={styles.entryTitle}>
                    {[edu.degree, edu.field].filter(Boolean).join(" in ") ||
                      "Degree"}
                  </Text>
                  <Text style={styles.entrySubtitle}>
                    {[edu.school, edu.gpa && `GPA: ${edu.gpa}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Text style={styles.entryDates}>
                  {dateRange(edu, c.dateFormat)}
                </Text>
              </View>
              {hasVisibleText(edu.description) &&
                richTextToPdf(edu.description, {
                  fontSize: base * 0.85,
                  color: bodyTextColorEff,
                  ...richTextOpts,
                })}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const namedSkills = skills.filter((s) => s.name);
  const namedLangs = languages.filter((l) => l.name);
  const twoColRows = Math.max(namedSkills.length, namedLangs.length);
  const renderPairedLevel = (
    item: { id: string; name: string; level: number } | undefined,
    labels: readonly string[],
  ) => {
    if (!item) return <View style={styles.col} />;
    if (c.skillsDisplay === "list") {
      return (
        <View
          style={[
            styles.col,
            { flexDirection: "row", alignItems: "center", columnGap: 4 },
          ]}
        >
          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: accent,
            }}
          />
          <Text style={{ flex: 1, fontSize: base * 0.85, color: bodyTextColorEff }}>
            {item.name}
          </Text>
        </View>
      );
    }
    if (c.toggles.dots) {
      return (
        <View
          style={[
            styles.col,
            { flexDirection: "row", justifyContent: "space-between" },
          ]}
        >
          <Text
            style={{
              flex: 1,
              fontSize: base * 0.85,
              color: bodyTextColorEff,
              paddingRight: 6,
            }}
          >
            {item.name}
          </Text>
          <View style={styles.dotRow} wrap={false}>
            {Array.from({ length: 5 }).map((_, d) => (
              <View
                key={d}
                style={[
                  styles.dot,
                  d < item.level
                    ? { backgroundColor: accent }
                    : { backgroundColor: bodyTextColorEff, opacity: 0.2 },
                ]}
              />
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.col}>
        <Text style={{ fontSize: base * 0.85, color: bodyTextColorEff }}>
          {item.name} ({labels[item.level - 1]})
        </Text>
      </View>
    );
  };

  const skillsLanguageNode = !listsInSidebar && twoColRows > 0 && (
    <View style={styles.section}>
      <View wrap={false} minPresenceAhead={32} style={styles.twoColRow}>
        <View style={styles.col}>
          {namedSkills.length > 0 && renderSectionTitle("Skills")}
        </View>
        <View style={styles.col}>
          {namedLangs.length > 0 && renderSectionTitle("Languages")}
        </View>
      </View>
      {Array.from({ length: twoColRows }, (_, i) => (
        <View
          key={`skill-lang-${namedSkills[i]?.id ?? "x"}-${namedLangs[i]?.id ?? i}`}
          wrap={false}
          minPresenceAhead={12}
          style={styles.twoColRow}
        >
          {renderPairedLevel(namedSkills[i], SKILL_LEVEL_LABELS)}
          {renderPairedLevel(namedLangs[i], LANGUAGE_LEVEL_LABELS)}
        </View>
      ))}
    </View>
  );

  const referencesNode = !listsInSidebar &&
    includeReferences &&
    references.length > 0 && (
      <View style={styles.section} minPresenceAhead={40}>
        {renderSectionTitle("References")}
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
          {references.map((r) => (
            <View
              key={r.id}
              style={{ width: "50%", paddingRight: 8 }}
              wrap={false}
            >
              <Text
                style={{
                  fontSize: base * 0.95,
                  fontFamily: variants.bold,
                  color: bodyTextColorEff,
                }}
              >
                {r.name || "Reference name"}
              </Text>
              <Text
                style={{ fontSize: base * 0.85, color: bodyAccentColorEff }}
              >
                {[r.jobTitle, r.company].filter(Boolean).join(", ")}
              </Text>
              <Text style={{ fontSize: base * 0.8, color: bodyAccentColorEff }}>
                {[r.email, r.phone].filter(Boolean).join("  ·  ")}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );

  const mainGroups: Record<
    "experience" | "skillsLanguage" | "references",
    React.ReactNode
  > = {
    experience: expEduNode,
    skillsLanguage: skillsLanguageNode,
    references: referencesNode,
  };

  return (
    <Document>
      <Page
        size={c.pageFormat === "letter" ? "LETTER" : "A4"}
        style={styles.page}
        wrap
      >
        {c.topAccentBar && <View style={styles.topAccentBar} fixed />}
        {hasSidebar && <View style={styles.sidebarBand} fixed />}
        {showFullBleedPhoto && (
          <Image src={personal.photoUrl} style={styles.sidebarPhoto} fixed />
        )}
        {hasSidebar && (
          <View
            style={[
              styles.sidebarContent,
              showFullBleedPhoto ? { top: FULL_BLEED_PHOTO_HEIGHT_PT } : {},
            ]}
            wrap={false}
          >
            {headerInSidebar && (
              <>
                {showPhoto && !c.sidebarPhotoFill && (
                  <Image src={personal.photoUrl} style={styles.photo} />
                )}
                <Text style={[styles.name, { textAlign: "center" }]}>
                  {personal.fullName || "Your Name"}
                </Text>
                <Text style={[styles.jobTitle, { textAlign: "center" }]}>
                  {personal.jobTitle || "Job Title"}
                </Text>
                <ContactRow
                  items={contactItems}
                  c={c}
                  accent={accent}
                  accentText={accentText}
                  color={headerTextColor}
                  fontSize={base * 0.8}
                  variant="column"
                />
              </>
            )}
            {listsInSidebar &&
              orderedSidebarKeys(c.sectionOrder).map((key) => {
                if (key === "skills" && skills.length > 0) {
                  return (
                    <View key="skills" style={styles.sidebarSection}>
                      {renderSectionTitle(
                        "Skills",
                        { alignSelf: "flex-start" },
                        sidebarHeadingsInk,
                      )}
                      {renderLevels(skills, SKILL_LEVEL_LABELS, sidebarInk)}
                    </View>
                  );
                }
                if (key === "language" && languages.length > 0) {
                  return (
                    <View key="language" style={styles.sidebarSection}>
                      {renderSectionTitle(
                        "Languages",
                        { alignSelf: "flex-start" },
                        sidebarHeadingsInk,
                      )}
                      {renderLevels(
                        languages,
                        LANGUAGE_LEVEL_LABELS,
                        sidebarInk,
                      )}
                    </View>
                  );
                }
                if (
                  key === "references" &&
                  includeReferences &&
                  references.length > 0
                ) {
                  return (
                    <View key="references" style={styles.sidebarSection}>
                      {renderSectionTitle(
                        "References",
                        { alignSelf: "flex-start" },
                        sidebarHeadingsInk,
                      )}
                      {references.map((r) => (
                        <View key={r.id} style={{ marginTop: 6 }}>
                          <Text
                            style={{
                              fontSize: base * 0.95,
                              fontFamily: variants.bold,
                              color: sidebarInk,
                            }}
                          >
                            {r.name || "Reference name"}
                          </Text>
                          <Text
                            style={{
                              fontSize: base * 0.85,
                              color: bodyAccentColorEff,
                            }}
                          >
                            {[r.jobTitle, r.company].filter(Boolean).join(", ")}
                          </Text>
                          <Text
                            style={{
                              fontSize: base * 0.8,
                              color: bodyAccentColorEff,
                            }}
                          >
                            {[r.email, r.phone].filter(Boolean).join("  ·  ")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                }
                return null;
              })}
          </View>
        )}

        {!headerInSidebar && c.headerLayout === "row" && showPhoto ? (
          <View style={styles.headerRow}>
            <Image src={personal.photoUrl} style={styles.photoRow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {personal.fullName || "Your Name"}
              </Text>
              <Text style={styles.jobTitle}>
                {personal.jobTitle || "Job Title"}
              </Text>
              <ContactRow
                items={contactItems}
                c={c}
                accent={accent}
                accentText={accentText}
                color={headerTextColor}
                fontSize={base * 0.8}
                variant="row"
              />
            </View>
          </View>
        ) : (
          !headerInSidebar && (
            <View style={styles.header}>
              {showPhoto && (
                <Image src={personal.photoUrl} style={styles.photo} />
              )}
              <Text style={styles.name}>
                {personal.fullName || "Your Name"}
              </Text>
              <Text style={styles.jobTitle}>
                {personal.jobTitle || "Job Title"}
              </Text>
              <ContactRow
                items={contactItems}
                c={c}
                accent={accent}
                accentText={accentText}
                color={headerTextColor}
                fontSize={base * 0.8}
                variant="row"
              />
            </View>
          )
        )}

        {hasVisibleText(personal.summary) && (
          <View style={styles.section} minPresenceAhead={40}>
            {renderSectionTitle("Summary")}
            {richTextToPdf(personal.summary, {
              fontSize: base * 0.9,
              color: bodyTextColorEff,
              ...richTextOpts,
            })}
          </View>
        )}

        {orderedMainGroups(c.sectionOrder).map((group) => (
          <Fragment key={group}>{mainGroups[group]}</Fragment>
        ))}
        {c.footerBar && <View style={styles.footerBar} fixed />}
        {c.pageBorder && <View style={styles.pageBorderFrame} fixed />}
      </Page>
    </Document>
  );
}
