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
import {
  NO_EXPERIENCE_TYPE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  SKILL_LEVEL_LABELS,
  type Customization,
  type EducationItem,
  type ExperienceItem,
  type LinkItem,
  type PersonalInfo,
  type Resume,
} from "../../../types/resume";
import { richTextToPdf, hasVisibleText } from "../../../lib/richTextToPdf";
import { pdfFontFamily, pdfFontVariants } from "../../../lib/fonts";
import { marginPercentPdf } from "../../../lib/pageSize";
import { idealTextColor } from "../../../lib/color";
import { orderedMainGroups, orderedSidebarKeys } from "../../../lib/sectionOrder";

const BASE_SIZE = { small: 9, medium: 10, large: 11 } as const;
function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function dateRange(
  item: Pick<ExperienceItem | EducationItem, "startDate" | "endDate" | "current">,
) {
  if (!item.startDate && !item.endDate && !item.current) return "";
  const end = item.current ? "Present" : fmtDate(item.endDate);
  return `${fmtDate(item.startDate)} – ${end}`;
}

function photoRadius(shape: Customization["photoShape"], size: number) {
  if (shape === "circle") return size / 2;
  if (shape === "rounded") return size * 0.16;
  return 0;
}

/** percent of the page width the sidebar column occupies, when present */
const SIDEBAR_WIDTH_PCT = 34;

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
  | "id";

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

/** renders a HeaderBlock/SidebarHeaderBlock's contact list, honoring
 *  headerIcons/linkIcons and linkStyle exactly like ResumePreview.tsx's
 *  contactItems()/IconText/LinkText, which the live preview already did
 *  but the PDF previously ignored entirely */
function ContactRow({
  items,
  c,
  accent,
  color,
  fontSize,
  variant,
}: {
  items: ContactItem[];
  c: Customization;
  accent: string;
  color: string;
  fontSize: number;
  variant: "row" | "column";
}) {
  if (items.length === 0) return null;
  const showLinkIcons = c.toggles.linkIcons || c.linkStyle === "icon";
  const linkStyle =
    c.linkStyle === "underline"
      ? { textDecoration: "underline" as const, color }
      : c.linkStyle === "color"
        ? { color: accent }
        : { color };

  return (
    <View
      style={
        variant === "row"
          ? {
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
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
      {items.map((item) => {
        const showIcon = item.isHeader ? c.toggles.headerIcons : showLinkIcons;
        return (
          <View
            key={item.key}
            style={{ flexDirection: "row", alignItems: "center", columnGap: 3 }}
          >
            {showIcon && <PdfIcon icon={item.icon} size={fontSize} color={color} />}
            <Text style={{ fontSize, color }}>
              {item.url ? (
                <Link src={item.url} style={linkStyle}>
                  {item.text}
                </Link>
              ) : (
                item.text
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Real A4/Letter page via @react-pdf/renderer. Entries use `wrap={false}`
 *  so a page break never lands mid-entry. */
export function ResumeDocument({ resume }: { resume: Resume }) {
  const {
    personal,
    experience,
    noExperience,
    education,
    skills,
    languages,
    references,
    includeReferences,
    customization: c,
  } = resume;
  const accent = c.accentColor;
  const base = BASE_SIZE[c.fontSize];
  const fontFamily = pdfFontFamily(c.fontFamily);
  const variants = pdfFontVariants(fontFamily);

  const gapSection = c.elementSpacing * (14 / 12);
  const gapEntry = c.elementSpacing * (8 / 12);

  const marginVerticalPct = marginPercentPdf(c.topBottomMargin, "vertical", c.pageFormat);
  const marginHorizontalPct = marginPercentPdf(c.leftRightMargin, "horizontal", c.pageFormat);

  // "single" palette mode derives heading/body accent surfaces from the one
  // accent pick without ever touching the independent multi-mode fields in
  // the store — switching modes never discards an edit, it just changes
  // which values are in effect (mirrors useTheme() in ResumePreview.tsx)
  const {
    headingBgColor: baseHeadingBgColor,
    headingTextColor: baseHeadingTextColor,
    bodyAccentColor: baseBodyAccentColor,
  } = c;
  const isSinglePalette = c.paletteMode === "single";
  const headingBgColorEff = isSinglePalette ? c.accentColor : baseHeadingBgColor;
  const headingTextColorEff = isSinglePalette
    ? idealTextColor(c.accentColor)
    : baseHeadingTextColor;
  const bodyAccentColorEff = isSinglePalette ? c.accentColor : baseBodyAccentColor;

  // see the matching comment in ResumePreview.tsx for why "border" falls
  // back to bodyTextColor instead of the heading text color
  const isColorFilled = c.colorLayout === "column";
  const isColorBordered = c.colorLayout === "border";
  const headerTextColor = isColorBordered ? c.bodyTextColor : headingTextColorEff;
  const pageBackgroundColor = c.colorLayout === "full" ? headingBgColorEff : c.bodyBgColor;

  const isFilled = c.headingBorder === "filled";
  const isOutline = c.headingBorder === "outline";
  const isLongLine = c.headingBorder === "line";
  const isLongUnderline = c.headingBorder === "underline";

  // ---------- sidebar layout derived from `columns` + `headerPosition` ----------
  // the sidebar only exists in two-column mode, so toggling `columns` always
  // has a visible effect; `headerPosition` then picks where within it (or
  // whether at all, for "top") the header sits.
  const hasSidebar = c.columns === "two";
  const headerInSidebar = hasSidebar && c.headerPosition !== "top";
  const listsInSidebar = hasSidebar;
  const sidebarSide: "left" | "right" = headerInSidebar
    ? (c.headerPosition as "left" | "right")
    : "left";

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
      color: c.bodyTextColor,
      backgroundColor: pageBackgroundColor,
      ...(isColorBordered
        ? { borderWidth: 4, borderColor: headingBgColorEff, borderStyle: "solid" }
        : null),
    },
    sidebarBand: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: `${SIDEBAR_WIDTH_PCT}%`,
      backgroundColor: isColorFilled ? headingBgColorEff : pageBackgroundColor,
      ...(sidebarSide === "left" ? { left: 0 } : { right: 0 }),
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
      alignItems: "center",
      marginBottom: gapSection,
      backgroundColor: isColorFilled ? headingBgColorEff : undefined,
    },
    photo: {
      width: c.photoSize * 0.8,
      height: c.photoSize * 0.8,
      borderRadius: photoRadius(c.photoShape, c.photoSize * 0.8),
      marginBottom: 8,
      objectFit: "cover",
    },
    name: {
      fontSize: c.fullNameSize,
      fontFamily: variants.bold,
      color: headerTextColor,
      lineHeight: c.lineHeight,
    },
    jobTitle: {
      fontSize: c.titleSize,
      fontFamily: variants.bold,
      marginTop: 2,
      color: accent,
      lineHeight: c.lineHeight,
    },
    section: { marginTop: gapSection },
    sectionTitle: {
      fontSize: c.headingsSize,
      fontFamily: variants.bold,
      textTransform: c.capitalization,
      letterSpacing: 1.5,
      paddingBottom: isOutline || isFilled ? 0 : 3,
      marginBottom: 6,
      alignSelf: "flex-start",
      color: isFilled ? "#ffffff" : accent,
      backgroundColor: isFilled ? accent : undefined,
      borderColor: accent,
      borderBottomWidth:
        !isOutline && !isFilled && !isLongLine && !isLongUnderline && c.toggles.headingsLine
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
      color: c.bodyTextColor,
      lineHeight: c.lineHeight,
    },
    entryMeta: { fontFamily: variants.regular, color: bodyAccentColorEff },
    entryDates: {
      fontSize: base * 0.78,
      color: bodyAccentColorEff,
      lineHeight: c.lineHeight,
    },
    entrySubtitle: {
      fontSize: base * 0.85,
      color: bodyAccentColorEff,
      marginTop: 1,
      lineHeight: c.lineHeight,
    },
    twoCol: { flexDirection: "row", marginTop: gapSection, gap: 24 },
    col: { flex: 1 },
    dotRow: { flexDirection: "row", gap: 3, alignItems: "center" },
    dot: { width: 5, height: 5, borderRadius: 2.5 },
  });

  const contactItems = buildContactItems(personal);

  const richTextOpts = { fontFamily, lineHeight: c.lineHeight };
  const showPhoto = c.showPhoto && !!personal.photoUrl;

  // "line" and "underline" heading styles need the title text plus a rule
  // that spans the rest of the row (or the full width below it), which a
  // plain <Text> can't do — every section heading goes through here so
  // those variants stay in sync everywhere
  const renderSectionTitle = (title: string, extraStyle?: Record<string, unknown>) =>
    isLongLine ? (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 6,
          columnGap: 6,
        }}
      >
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
        <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: accent }} />
      </View>
    ) : isLongUnderline ? (
      <View style={{ marginBottom: 6 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 3 }]}>{title}</Text>
        <View style={{ borderTopWidth: 1, borderTopColor: accent, width: "100%" }} />
      </View>
    ) : (
      <Text style={extraStyle ? [styles.sectionTitle, extraStyle] : styles.sectionTitle}>
        {title}
      </Text>
    );

  const renderLevels = (
    items: { id: string; name: string; level: number }[],
    labels: readonly string[],
  ) =>
    c.toggles.dots ? (
      <View>
        {items
          .filter((i) => i.name)
          .map((i) => (
            <View
              key={i.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: base * 0.85, color: c.bodyTextColor }}>
                {i.name}
              </Text>
              <View style={styles.dotRow}>
                {Array.from({ length: 5 }).map((_, d) => (
                  <View
                    key={d}
                    style={[
                      styles.dot,
                      { backgroundColor: d < i.level ? accent : "#e5e5e5" },
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
      </View>
    ) : (
      <Text style={{ fontSize: base * 0.85, color: c.bodyTextColor }}>
        {items
          .map((i) => (i.name ? `${i.name} (${labels[i.level - 1]})` : ""))
          .filter(Boolean)
          .join("  ·  ")}
      </Text>
    );

  // experience/education, skills+languages, and references render as
  // independent groups here, then get concatenated below in whatever order
  // `sectionOrder` specifies (mirrors ResumePreview.tsx's block grouping)
  const expEduNode = (
    <>
      {experience.length > 0 && (
        <View style={styles.section} minPresenceAhead={40}>
          {c.toggles.headings && renderSectionTitle("Experience")}
          {experience.map((exp) => (
            <View key={exp.id} style={styles.entry} wrap={false}>
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryTitle}>
                  {exp.jobTitle || "Job title"}
                  {(exp.company || exp.location) && (
                    <Text style={styles.entryMeta}>
                      {" "}— {[exp.company, exp.location].filter(Boolean).join(", ")}
                    </Text>
                  )}
                </Text>
                {c.toggles.dates && (
                  <Text style={styles.entryDates}>{dateRange(exp)}</Text>
                )}
              </View>
              {hasVisibleText(exp.description) &&
                richTextToPdf(exp.description, {
                  fontSize: base * 0.85,
                  color: c.bodyTextColor,
                  ...richTextOpts,
                })}
            </View>
          ))}
        </View>
      )}

      {experience.length === 0 && noExperience.length > 0 && (
        <View style={styles.section} minPresenceAhead={40}>
          {c.toggles.headings && renderSectionTitle("Experience")}
          {noExperience.map((exp) => (
            <View key={exp.id} style={styles.entry} wrap={false}>
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryTitle}>
                  {NO_EXPERIENCE_TYPE_LABELS[exp.type]}
                  {(exp.title || exp.subtitle) && (
                    <Text style={styles.entryMeta}>
                      {" "}
                      —{" "}
                      {exp.title &&
                        (exp.url.trim() ? (
                          <Link src={exp.url}>{exp.title}</Link>
                        ) : (
                          exp.title
                        ))}
                      {exp.title && exp.subtitle && ", "}
                      {exp.subtitle}
                    </Text>
                  )}
                </Text>
                {c.toggles.dates && (
                  <Text style={styles.entryDates}>{dateRange(exp)}</Text>
                )}
              </View>
              {hasVisibleText(exp.description) &&
                richTextToPdf(exp.description, {
                  fontSize: base * 0.85,
                  color: c.bodyTextColor,
                  ...richTextOpts,
                })}
            </View>
          ))}
        </View>
      )}

      {education.length > 0 && (
        <View style={styles.section} minPresenceAhead={40}>
          {c.toggles.headings && renderSectionTitle("Education")}
          {education.map((edu) => (
            <View key={edu.id} style={styles.entry} wrap={false}>
              <View style={styles.entryHeaderRow}>
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
                {c.toggles.dates && (
                  <Text style={styles.entryDates}>{dateRange(edu)}</Text>
                )}
              </View>
              {hasVisibleText(edu.description) &&
                richTextToPdf(edu.description, {
                  fontSize: base * 0.85,
                  color: c.bodyTextColor,
                  ...richTextOpts,
                })}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const skillsLanguageNode = !listsInSidebar &&
    (skills.length > 0 || languages.length > 0) && (
      <View style={styles.twoCol} wrap={false}>
        {skills.length > 0 && (
          <View style={styles.col}>
            {c.toggles.headings && renderSectionTitle("Skills")}
            {renderLevels(skills, SKILL_LEVEL_LABELS)}
          </View>
        )}
        {languages.length > 0 && (
          <View style={styles.col}>
            {c.toggles.headings && renderSectionTitle("Languages")}
            {renderLevels(languages, LANGUAGE_LEVEL_LABELS)}
          </View>
        )}
      </View>
    );

  const referencesNode = !listsInSidebar &&
    includeReferences &&
    references.length > 0 && (
      <View style={styles.section} minPresenceAhead={40}>
        {c.toggles.headings && renderSectionTitle("References")}
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
          {references.map((r) => (
            <View key={r.id} style={{ width: "50%", paddingRight: 8 }} wrap={false}>
              <Text style={{ fontSize: base * 0.95, fontFamily: variants.bold, color: c.bodyTextColor }}>
                {r.name || "Reference name"}
              </Text>
              <Text style={{ fontSize: base * 0.85, color: bodyAccentColorEff }}>
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

  const mainGroups: Record<"experience" | "skillsLanguage" | "references", React.ReactNode> = {
    experience: expEduNode,
    skillsLanguage: skillsLanguageNode,
    references: referencesNode,
  };

  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={styles.page} wrap>
        {hasSidebar && <View style={styles.sidebarBand} fixed />}
        {hasSidebar && (
          <View style={styles.sidebarContent} wrap={false}>
            {headerInSidebar && (
              <>
                {showPhoto && <Image src={personal.photoUrl} style={styles.photo} />}
                <Text style={[styles.name, { textAlign: "center" }]}>
                  {personal.fullName || "Your Name"}
                </Text>
                {c.toggles.jobTitle && (
                  <Text style={[styles.jobTitle, { textAlign: "center" }]}>
                    {personal.jobTitle || "Job Title"}
                  </Text>
                )}
                <ContactRow
                  items={contactItems}
                  c={c}
                  accent={accent}
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
                      {c.toggles.headings &&
                        renderSectionTitle("Skills", { alignSelf: "flex-start" })}
                      {renderLevels(skills, SKILL_LEVEL_LABELS)}
                    </View>
                  );
                }
                if (key === "language" && languages.length > 0) {
                  return (
                    <View key="language" style={styles.sidebarSection}>
                      {c.toggles.headings &&
                        renderSectionTitle("Languages", { alignSelf: "flex-start" })}
                      {renderLevels(languages, LANGUAGE_LEVEL_LABELS)}
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
                      {c.toggles.headings &&
                        renderSectionTitle("References", { alignSelf: "flex-start" })}
                      {references.map((r) => (
                        <View key={r.id} style={{ marginTop: 6 }}>
                          <Text style={{ fontSize: base * 0.95, fontFamily: variants.bold, color: c.bodyTextColor }}>
                            {r.name || "Reference name"}
                          </Text>
                          <Text style={{ fontSize: base * 0.85, color: bodyAccentColorEff }}>
                            {[r.jobTitle, r.company].filter(Boolean).join(", ")}
                          </Text>
                          <Text style={{ fontSize: base * 0.8, color: bodyAccentColorEff }}>
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

        {!headerInSidebar && (
          <View style={styles.header}>
            {showPhoto && <Image src={personal.photoUrl} style={styles.photo} />}
            <Text style={styles.name}>{personal.fullName || "Your Name"}</Text>
            {c.toggles.jobTitle && (
              <Text style={styles.jobTitle}>{personal.jobTitle || "Job Title"}</Text>
            )}
            <ContactRow
              items={contactItems}
              c={c}
              accent={accent}
              color={headerTextColor}
              fontSize={base * 0.8}
              variant="row"
            />
          </View>
        )}

        {hasVisibleText(personal.summary) && (
          <View style={styles.section} minPresenceAhead={40}>
            {c.toggles.headings && renderSectionTitle("Summary")}
            {richTextToPdf(personal.summary, {
              fontSize: base * 0.9,
              color: c.bodyTextColor,
              ...richTextOpts,
            })}
          </View>
        )}

        {orderedMainGroups(c.sectionOrder).map((group) => (
          <Fragment key={group}>{mainGroups[group]}</Fragment>
        ))}
      </Page>
    </Document>
  );
}
