import {
  View,
  Text,
  Image,
  Link,
  Svg,
  Circle,
  Path,
  Rect,
} from "@react-pdf/renderer";
import type {
  Customization,
  EducationItem,
  LanguageItem,
  ReferenceItem,
  Resume,
} from "../../../types/resume";
import { richTextToPdf, hasVisibleText } from "../../../lib/richTextToPdf";
import { contrastOn } from "../../../lib/color";
import { resumePhotoSrc } from "../../../lib/personAvatar";
import { listKey } from "../../../lib/resumeIds";
import { headingBoxMetrics, resumeHeading } from "../../../lib/resumeHeadings";
import { PdfIcon, type IconKey } from "./pdfIcons";
import { contactIconKey } from "../../../lib/resumeIcons";
import { clampedLevel } from "../layouts/shared";

import {
  ATS,
  FONT_SIZE_RATIO,
  PX_TO_PT,
  sp,
  dateRange,
  gpaText,
  headingCapStyle,
  languageLabel,
  type ContactLineItem,
  type JobLike,
  type PdfTheme,
} from "./pdfTheme";
export function PdfRich({
  html,
  t,
  color,
  size,
  align,
}: {
  html: string;
  t: PdfTheme;
  color?: string;
  /** pt; defaults to body size */
  size?: number;
  align?: "left" | "center" | "right" | "justify";
}) {
  if (!hasVisibleText(html)) return null;
  return (
    <>
      {richTextToPdf(html, {
        color: color ?? t.ink,
        fontSize: size ?? t.base,
        fontFamily: t.font,
        lineHeight: t.lineHeight,
        align,
        bulletStyle: t.c.bulletStyle,
      })}
    </>
  );
}


export function PdfHeading({
  title,
  t,
  color,
  size,
  rule = true,
  ruleColor,
  ruleWidth = 36,
  icon,
  marginBottom,
}: {
  title: string;
  t: PdfTheme;
  color?: string;
  /** px, as the preview passes `customization.headingsSize` */
  size?: number;
  rule?: boolean;
  ruleColor?: string;
  /** short accent tick (px) or `"full"` for a hairline across the column */
  ruleWidth?: number | "full";
  icon?: IconKey;
  marginBottom?: number;
}) {
  const { c } = t;
  const border = c.headingBorder ?? "none";
  const showLineToggle = c.toggles.headingsLine;
  const ink =
    color || (c.toggles.headings && c.accentColor ? c.accentColor : t.ink);
  const barColor = ruleColor || (c.toggles.headings ? c.accentColor : color) || ink;
  const boxColor = ink || c.accentColor || ATS.navy;
  const gap = marginBottom ?? t.gap;
  const isFilled = border === "filled";
  const isOutline = border === "outline";
  const isLongLine = border === "line";
  const isUnderline = border === "underline";
  const showShortRule =
    rule && showLineToggle && (border === "none" || border === "line");
  const label = resumeHeading(title, c);
  const headingPx = size ?? c.headingsSize ?? 11;
  const fontSize = headingPx * FONT_SIZE_RATIO;
  // the same box the preview draws, in px, converted below
  const box = headingBoxMetrics(headingPx, c);
  const cap = headingCapStyle(c);
  const textInk = isFilled ? contrastOn(boxColor) : ink;

  const heading = (
    <Text
      style={{
        fontFamily: t.variants.bold,
        fontSize,
        color: textInk,
        ...cap,
        ...(isFilled
          ? {
              backgroundColor: boxColor,
              paddingVertical: box.paddingY * PX_TO_PT,
              paddingHorizontal: box.paddingX * PX_TO_PT,
              borderRadius: box.radius * PX_TO_PT,
            }
          : null),
        ...(isOutline
          ? {
              borderWidth: box.borderWidth * PX_TO_PT,
              borderColor: boxColor,
              borderStyle: "solid",
              borderRadius: box.radius * PX_TO_PT,
              paddingVertical: box.paddingY * PX_TO_PT,
              paddingHorizontal: box.paddingX * PX_TO_PT,
            }
          : null),
      }}
    >
      {label}
    </Text>
  );


  const boxed = isFilled || isOutline;
  const titleRow = icon ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <PdfIcon icon={icon} size={fontSize} color={textInk} />
      {heading}
    </View>
  ) : (
    heading
  );

  if (isLongLine && rule && !showLineToggle) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: sp(2),
          marginBottom: gap,
        }}
      >
        <View>{titleRow}</View>
        <View
          style={{ height: PX_TO_PT, flexGrow: 1, backgroundColor: barColor }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: gap }}>
      <View style={boxed ? { flexDirection: "row" } : undefined}>
        {boxed ? <View>{titleRow}</View> : titleRow}
      </View>
      {(isUnderline || showShortRule) && (
        <View
          style={{
            marginTop: sp(1.5),
            height:
              isUnderline || ruleWidth === "full" ? PX_TO_PT : 2 * PX_TO_PT,
            width:
              isUnderline || ruleWidth === "full"
                ? "100%"
                : (ruleWidth as number) * PX_TO_PT,
            backgroundColor: barColor,
          }}
        />
      )}
    </View>
  );
}



export function PdfJobBlock({
  job,
  t,
  ink,
  muted,
  titleFirst = true,
}: {
  job: JobLike;
  t: PdfTheme;
  ink?: string;
  muted?: string;
  titleFirst?: boolean;
}) {
  const inkColor = ink ?? t.ink;
  const mutedColor = muted ?? t.muted;
  const size = t.em(0.9);
  const primary = titleFirst ? job.jobTitle : job.company || job.jobTitle;
  const secondary = titleFirst
    ? [job.company, job.location].filter(Boolean).join(" · ")
    : job.jobTitle;
  const dates = dateRange(job, t.dateFmt, t.c);
  return (
    <View style={{ fontSize: size }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: sp(3),
        }}
      >
        <Text style={{ fontFamily: t.variants.bold, color: inkColor, flexShrink: 1 }}>
          {primary}
        </Text>
        {dates ? (
          <Text style={{ fontSize: size * 0.92, color: mutedColor, flexShrink: 0 }}>
            {dates}
          </Text>
        ) : null}
      </View>
      {secondary ? (
        <Text
          style={{
            marginTop: sp(0.5),
            fontFamily: t.variants.regular,
            color: mutedColor,
          }}
        >
          {secondary}
        </Text>
      ) : null}
      <View style={{ marginTop: sp(1.5) }}>
        <PdfRich html={job.description} t={t} color={inkColor} size={size} />
      </View>
    </View>
  );
}

export function PdfEducationBlock({
  edu,
  t,
  ink,
  muted,
  accent,
}: {
  edu: EducationItem;
  t: PdfTheme;
  ink?: string;
  muted?: string;
  accent?: string;
}) {
  const mutedColor = muted ?? t.muted;
  const size = t.em(0.9);
  const dates = dateRange(edu, t.dateFmt, t.c);
  const degree = [edu.degree, edu.field].filter(Boolean).join(" - ");
  return (
    <View style={{ fontSize: size }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: sp(3),
        }}
      >
        <Text style={{ fontFamily: t.variants.bold, flexShrink: 1, color: ink ?? t.ink }}>
          {edu.school}
        </Text>
        {dates ? (
          <Text style={{ color: mutedColor, flexShrink: 0 }}>{dates}</Text>
        ) : null}
      </View>
      {degree ? (
        <Text
          style={{
            fontFamily: t.variants.regular,
            color: accent || mutedColor,
          }}
        >
          {degree}
        </Text>
      ) : null}
      {edu.gpa ? (
        <Text style={{ color: mutedColor }}>{gpaText(edu.gpa, t.c)}</Text>
      ) : null}
      <View style={{ marginTop: sp(1) }}>
        <PdfRich
          html={edu.description}
          t={t}
          color={ink || mutedColor}
          size={size * 0.95}
        />
      </View>
    </View>
  );
}

export function PdfLanguagesBlock({
  languages,
  t,
  color,
  showLevel = true,
}: {
  languages: LanguageItem[];
  t: PdfTheme;
  color?: string;
  showLevel?: boolean;
}) {
  if (languages.length === 0) return null;
  return (
    <View style={{ gap: sp(1.5) }}>
      {languages.map((l, i) => {
        const level = showLevel ? languageLabel(l.level, t.c) : "";
        return (
          <Text
            key={listKey(l.id, i, "lang")}
            style={{ fontSize: t.em(0.85), color: color ?? t.muted }}
          >
            {l.name}
            {level ? ` - ${level}` : ""}
          </Text>
        );
      })}
    </View>
  );
}

export function PdfReferencesBlock({
  references,
  includeReferences,
  t,
  ink,
  muted,
  max,
  columns = 2,
}: {
  references: ReferenceItem[];
  includeReferences: boolean;
  t: PdfTheme;
  ink?: string;
  muted?: string;
  max?: number;
  /** the preview uses a 2-up grid; sidebars pass 1 */
  columns?: 1 | 2;
}) {
  if (!includeReferences || references.length === 0) return null;
  const list = max ? references.slice(0, max) : references;
  const mutedColor = muted ?? t.muted;
  const size = t.em(0.85);
  return (
    <View
      style={{
        flexDirection: columns === 2 ? "row" : "column",
        flexWrap: columns === 2 ? "wrap" : "nowrap",
        gap: sp(4),
      }}
    >
      {list.map((r, i) => (
        <View
          key={listKey(r.id, i, "ref")}
          style={{
            fontSize: size,
            width: columns === 2 ? "47%" : "100%",
          }}
        >
          <Text style={{ fontFamily: t.variants.bold, color: ink ?? t.ink }}>
            {r.name}
          </Text>
          {[r.jobTitle, r.company].filter(Boolean).length > 0 ? (
            <Text style={{ color: mutedColor }}>
              {[r.jobTitle, r.company].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {r.phone ? <Text style={{ color: mutedColor }}>{r.phone}</Text> : null}
          {r.email ? <Text style={{ color: mutedColor }}>{r.email}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function PdfSkillsList({
  skills,
  t,
  color,
  light = false,
  fill,
}: {
  skills: Resume["skills"];
  t: PdfTheme;
  color?: string;
  /** rendering on a dark sidebar - dots go white, empties translucent */
  light?: boolean;
  fill?: string;
}) {
  if (skills.length === 0) return null;
  const size = t.em(0.85);
  const textColor = color ?? (light ? ATS.onDark : t.muted);
  if (t.c.skillsDisplay === "list") {
    const tick = light ? "#fff" : fill || t.accent;
    return (
      <View style={{ gap: sp(1.5) }}>
        {skills.map((s, i) => (
          <View
            key={listKey(s.id, i, "skill")}
            style={{ flexDirection: "row", gap: sp(2) }}
          >
            {/* mt-[0.45em] h-1 w-1 */}
            <View style={{ paddingTop: size * 0.45 }}>
              <Svg width={sp(1)} height={sp(1)} viewBox="0 0 4 4">
                <Circle cx="2" cy="2" r="2" fill={tick} />
              </Svg>
            </View>
            <Text style={{ fontSize: size, color: textColor, flexShrink: 1 }}>
              {s.name}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  const dotFill = fill || t.accent;
  const empty = light ? "rgba(255,255,255,0.35)" : ATS.line;
  const dot = 8 * PX_TO_PT;
  return (
    <View style={{ gap: sp(2) }}>
      {skills.map((s, i) => {
        const filled = clampedLevel(s.level);
        return (
          <View key={listKey(s.id, i, "skill")}>
            <Text
              style={{
                fontSize: size,
                color: textColor,
                marginBottom: sp(1),
              }}
            >
              {s.name}
            </Text>
            {/* gap-[3px] - a real pixel value, not a Tailwind step */}
            <View style={{ flexDirection: "row", gap: 3 * PX_TO_PT }}>
              {Array.from({ length: 5 }).map((_, d) => (
                <View
                  key={d}
                  style={{
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                    backgroundColor:
                      d < filled ? (light ? "#fff" : dotFill) : empty,
                  }}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function PdfContactLines({
  contacts,
  t,
  color,
  icons = true,
  size,
  gap,
}: {
  contacts: ContactLineItem[];
  t: PdfTheme;
  color?: string;
  icons?: boolean;
  size?: number;
  gap?: number;
}) {
  if (contacts.length === 0) return null;
  const fontSize = size ?? t.em(0.8);
  const ink = color ?? t.ink;
  return (
    <View style={{ gap: gap ?? sp(2) }}>
      {contacts.map((item, i) => (
        <View
          key={listKey(item.id, i, "contact")}
          style={{ flexDirection: "row", gap: sp(2) }}
        >
          {icons ? (
            // the preview draws a fixed h-3.5 w-3.5 glyph, nudged mt-0.5
            <View style={{ paddingTop: sp(0.5) }}>
              <PdfIcon
                icon={contactIconKey(item)}
                size={sp(3.5)}
                color={ink}
              />
            </View>
          ) : null}
          {item.href ? (
            <Link
              src={item.href}
              style={{
                fontSize,
                color: ink,
                textDecoration: t.c.linkStyle.includes("underline")
                  ? "underline"
                  : "none",
                flexShrink: 1,
              }}
            >
              {item.text}
            </Link>
          ) : (
            <Text style={{ fontSize, color: ink, flexShrink: 1 }}>
              {item.text}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}


export function PdfContactInline({
  contacts,
  t,
  color,
  size,
  separator = "  ·  ",
}: {
  contacts: ContactLineItem[];
  t: PdfTheme;
  color?: string;
  size?: number;
  separator?: string;
}) {
  if (contacts.length === 0) return null;
  return (
    <Text style={{ fontSize: size ?? t.em(0.8), color: color ?? t.muted }}>
      {contacts.map((c) => c.text).join(separator)}
    </Text>
  );
}

function radiusFor(
  shape: Customization["photoShape"] = "circle",
  size: number,
) {
  if (shape === "circle") return size / 2;
  if (shape === "rounded") return size * 0.1;
  return 0;
}


function PdfAvatar({ size, bg = "#0F2942" }: { size: number; bg?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Rect x="0" y="0" width="200" height="200" fill={bg} />
      <Circle cx="100" cy="72" r="38" fill="#EEF3F6" />
      <Path
        d="M28 200c4-50 34-76 72-76s68 26 72 76"
        fill="#EEF3F6"
      />
    </Svg>
  );
}

function hasEmbeddablePhoto(personal: { photoUrl?: string }) {
  const url = personal.photoUrl?.trim();
  return !!url && !url.startsWith("data:image/svg");
}

export function PdfPhotoBox({
  t,
  size,
  shape,
  border,
  borderColor = "#fff",
  align,
}: {
  t: PdfTheme;
  size?: number;
  shape?: Customization["photoShape"];
  border?: boolean;
  borderColor?: string;
  align?: "flex-start" | "center" | "flex-end";
}) {
  const { c, resume } = t;
  if (!c.showPhoto) return null;
  const px = size ?? c.photoSize ?? 96;
  const pt = px * PX_TO_PT;
  const resolvedBorder = border ?? c.photoBorder;
  const frame = {
    width: pt,
    height: pt,
    borderRadius: radiusFor(shape ?? c.photoShape, pt),
    alignSelf: align,
    ...(resolvedBorder
      ? {
          borderWidth: 2.5 * PX_TO_PT,
          borderColor,
          borderStyle: "solid" as const,
        }
      : null),
  };
  if (!hasEmbeddablePhoto(resume.personal)) {
    return (
      <View style={{ ...frame, overflow: "hidden" }}>
        <PdfAvatar size={pt} />
      </View>
    );
  }
  return (
    <Image
      src={resumePhotoSrc(resume.personal)}
      style={{ ...frame, objectFit: "cover" }}
    />
  );
}

export function PdfFullBleedPhoto({
  t,
  height,
  fill = ATS.navy,
  railWidth,
}: {
  t: PdfTheme;
  height: number;
  fill?: string;
  railWidth: number;
}) {
  const { c, resume } = t;
  if (!c.showPhoto) {
    return <View style={{ width: "100%", height, backgroundColor: fill }} />;
  }
  const widthPct = Math.min(100, Math.max(56, c.photoSize ?? 80)) / 100;
  const box = Math.min(railWidth * widthPct, height);
  const frame = {
    width: box,
    height: box,
    borderRadius: radiusFor(c.photoShape, box),
    ...(c.photoBorder
      ? {
          borderWidth: 2.5 * PX_TO_PT,
          borderColor: "#fff",
          borderStyle: "solid" as const,
        }
      : null),
  };
  return (
    <View
      style={{
        width: "100%",
        height,
        backgroundColor: fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {hasEmbeddablePhoto(resume.personal) ? (
        <Image
          src={resumePhotoSrc(resume.personal)}
          style={{ ...frame, objectFit: "cover" }}
        />
      ) : (
        <View style={{ ...frame, overflow: "hidden" }}>
          <PdfAvatar size={box} bg={fill} />
        </View>
      )}
    </View>
  );
}

