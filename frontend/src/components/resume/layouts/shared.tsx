import type {
  Customization,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  LayoutVariant,
  LinkItem,
  NoExperienceItem,
  PersonalInfo,
  ReferenceItem,
  Resume,
} from "../../../types/resume";
import {
  LANGUAGE_LEVEL_LABELS,
} from "../../../types/resume";
import { extraExperienceTitle } from "../../../lib/experienceDisplay";
import { photoImgStyle } from "../../../lib/photoFit";
import { cssFontStack } from "../../../lib/fonts";
import { listKey } from "../../../lib/resumeIds";
import { resumePhotoSrc } from "../../../lib/personAvatar";
import { hrefFromUrl, linkDisplayLabel, looksLikeUrl } from "../../../lib/contactLinks";
import { contrastOn } from "../../../lib/color";

export { listKey };

/** Prefer month+year for ATS parsers (e.g. "Jan 2022 – Present"). */
export function fmtDate(
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

export function dateRange(
  item: Pick<
    ExperienceItem | EducationItem | NoExperienceItem,
    "startDate" | "endDate" | "current"
  >,
  format: Customization["dateFormat"] = "monthYear",
) {
  if (!item.startDate && !item.endDate && !item.current) return "";
  const end = item.current ? "Present" : fmtDate(item.endDate, format);
  const start = fmtDate(item.startDate, format);
  if (!start && !end) return "";
  return `${start} – ${end}`;
}

export function hasText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

export function firstWebsite(personal: PersonalInfo) {
  return (
    personal.website[0]?.url ||
    personal.portfolio[0]?.url ||
    personal.linkedin[0]?.url ||
    personal.github[0]?.url ||
    ""
  );
}

export type ContactLineItem = {
  id: string;
  text: string;
  kind:
    | "phone"
    | "email"
    | "location"
    | "nationality"
    | "passport"
    | "link";
  href?: string;
};

function pushLinkLines(
  lines: ContactLineItem[],
  items: LinkItem[],
  prefix: string,
) {
  items.forEach((entry, i) => {
    const url = (entry.url || "").trim();
    const title = (entry.title || "").trim();
    if (!url && !title) return;
    const href = url ? hrefFromUrl(url) : looksLikeUrl(title) ? hrefFromUrl(title) : "";
    lines.push({
      id: `${prefix}-${entry.id || i}`,
      text: linkDisplayLabel(entry, prefix),
      kind: "link",
      href: href || undefined,
    });
  });
}

/** Every personal contact field from the Resume type, for layout contact blocks. */
export function personalContactLines(
  personal: PersonalInfo,
): ContactLineItem[] {
  const lines: ContactLineItem[] = [];
  if (personal.phone)
    lines.push({
      id: "phone",
      text: personal.phone,
      kind: "phone",
      href: `tel:${personal.phone.replace(/\s+/g, "")}`,
    });
  if (personal.email)
    lines.push({
      id: "email",
      text: personal.email,
      kind: "email",
      href: `mailto:${personal.email}`,
    });
  if (personal.location)
    lines.push({ id: "location", text: personal.location, kind: "location" });
  if (personal.nationality)
    lines.push({
      id: "nationality",
      text: personal.nationality,
      kind: "nationality",
    });
  if (personal.passportId)
    lines.push({
      id: "passport",
      text: personal.passportId,
      kind: "passport",
    });
  pushLinkLines(lines, personal.website, "website");
  pushLinkLines(lines, personal.linkedin, "linkedin");
  pushLinkLines(lines, personal.portfolio, "portfolio");
  pushLinkLines(lines, personal.github, "github");
  pushLinkLines(lines, personal.gitlab, "gitlab");
  pushLinkLines(lines, personal.stackoverflow, "stackoverflow");
  pushLinkLines(lines, personal.telegram, "telegram");
  return lines;
}

export function ContactLink({
  item,
  className,
}: {
  item: ContactLineItem;
  className?: string;
}) {
  if (!item.href) return <>{item.text}</>;
  const external = item.href.startsWith("http");
  return (
    <a
      href={item.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={className ?? "underline-offset-2 hover:underline"}
      style={{
        color: "var(--resume-link-color, inherit)",
        textDecoration: "var(--resume-link-decoration, none)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {item.text}
    </a>
  );
}

export function ContactInline({
  contacts,
  className,
  style,
  separator = "  ·  ",
}: {
  contacts: ContactLineItem[];
  className?: string;
  style?: React.CSSProperties;
  separator?: string;
}) {
  return (
    <p className={className} style={style}>
      {contacts.map((c, i) => (
        <span key={c.id}>
          {i > 0 ? separator : null}
          <ContactLink item={c} />
        </span>
      ))}
    </p>
  );
}

export function languageLabel(level: number) {
  if (level >= 1 && level <= 5) return LANGUAGE_LEVEL_LABELS[level - 1];
  return "";
}

export function clampedLevel(level: number, max = 5) {
  return Math.max(1, Math.min(max, Math.round(level || 3)));
}

export function layoutFont(customization: Customization) {
  return cssFontStack(customization.fontFamily);
}

/** Soft professional palette helpers */
export const ATS = {
  ink: "#1E293B",
  muted: "#64748B",
  line: "#CBD5E1",
  paper: "#FFFFFF",
  navy: "#0F2942",
  slate: "#334155",
  /** Body copy on navy/charcoal sidebars — never inherit a dark accent. */
  onDark: "rgba(255,255,255,0.92)",
};

/** Root page styles shared by every special layout - honors Customize controls. */
export function layoutPageStyle(
  customization: Customization,
  fallbackBg = "#FFFFFF",
): React.CSSProperties {
  const linkColor = customization.linkStyle.includes("color")
    ? customization.accentColor
    : "inherit";
  const linkDecoration = customization.linkStyle.includes("underline")
    ? "underline"
    : "none";
  return {
    fontFamily: layoutFont(customization),
    fontSize: customization.fontSize,
    lineHeight: customization.lineHeight || 1.45,
    color: customization.bodyTextColor || ATS.ink,
    backgroundColor: customization.bodyBgColor || fallbackBg,
    ["--resume-link-color" as string]: linkColor,
    ["--resume-link-decoration" as string]: linkDecoration,
  } as React.CSSProperties;
}

const SIDEBAR_BG_VARIANTS: LayoutVariant[] = [
  "designerBlock",
  "techSplit",
  "bankingClean",
  "freshSidebar",
  "navyAnalyst",
  "ribbonFold",
  "graphicPro",
  "executiveCard",
  "corporateBand",
  "monoPill",
  "compactTech",
];

/** Layouts where PhotoBox shape/size/border controls apply. */
const PHOTO_VARIANTS: LayoutVariant[] = [
  "techSplit",
  "bankingClean",
  "freshSidebar",
  "navyAnalyst",
  "ribbonFold",
  "executiveCard",
  "designerBlock",
  "graphicPro",
  "monoPill",
];

/** Layouts that can show/hide a photo (including full-bleed rails). */
const PHOTO_SLOT_VARIANTS: LayoutVariant[] = PHOTO_VARIANTS;

export function isSpecialLayoutVariant(variant: LayoutVariant | undefined) {
  return !!variant && variant !== "default";
}

export function usesSidebarBg(variant: LayoutVariant | undefined) {
  return !!variant && SIDEBAR_BG_VARIANTS.includes(variant);
}

export function usesPhotoControls(variant: LayoutVariant | undefined) {
  return !!variant && PHOTO_VARIANTS.includes(variant);
}

export function usesPhotoSlot(variant: LayoutVariant | undefined) {
  return !!variant && PHOTO_SLOT_VARIANTS.includes(variant);
}

/** Border-radius for photo containers from Customize photoShape. */
export function photoRadius(shape: Customization["photoShape"] = "circle") {
  if (shape === "circle") return "50%";
  if (shape === "rounded") return "10%";
  return "0";
}

export type JobLike = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export function normalizeJobs(
  experience: ExperienceItem[],
  noExperience: NoExperienceItem[],
  order?: string[],
): JobLike[] {
  const extras: JobLike[] = (noExperience ?? []).map((n, i) => ({
    id: n.id?.trim() ? n.id : `noexp-${i}`,
    jobTitle: extraExperienceTitle(n),
    company: n.subtitle,
    location: "",
    startDate: n.startDate,
    endDate: n.endDate,
    current: n.current,
    description: n.description,
  }));
  const jobs = (experience ?? []).map((item, i) =>
    item.id?.trim() ? item : { ...item, id: `exp-${i}` },
  );
  const all = [...jobs, ...extras];
  const seen = new Set<string>();
  const unique = all.map((item, i) => {
    const trimmed = item.id?.trim() ?? "";
    let id = trimmed && !seen.has(trimmed) ? trimmed : `job-${i}`;
    if (seen.has(id)) id = `job-${i}-${seen.size}`;
    seen.add(id);
    return id === item.id ? item : { ...item, id };
  });
  if (!order?.length) return unique;
  const byId = new Map(unique.map((item) => [item.id, item]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((item): item is JobLike => !!item);
  const used = new Set(ordered.map((item) => item.id));
  return [...ordered, ...unique.filter((item) => !used.has(item.id))];
}

/** Full-rail photo that still honors Customize shape, size, and border. */
export function FullBleedPhoto({
  personal,
  customization,
  aspectRatio = "1 / 1",
  fill = ATS.navy,
  className = "",
}: {
  personal: PersonalInfo;
  customization: Customization;
  aspectRatio?: string;
  fill?: string;
  className?: string;
}) {
  const widthPct = Math.min(100, Math.max(56, customization.photoSize ?? 80));
  const radius = photoRadius(customization.photoShape);
  return (
    <div
      className={`flex w-full shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ aspectRatio, backgroundColor: fill }}
    >
      {customization.showPhoto ? (
        <div
          className="overflow-hidden"
          style={{
            width: `${widthPct}%`,
            aspectRatio: "1 / 1",
            borderRadius: radius,
            border: customization.photoBorder ? "2.5px solid #fff" : undefined,
            backgroundColor: fill,
          }}
        >
          <img
            src={resumePhotoSrc(personal)}
            alt={personal.fullName || "Profile"}
            className="h-full w-full object-cover"
            style={photoImgStyle(personal)}
          />
        </div>
      ) : null}
    </div>
  );
}

export function PhotoBox({
  personal,
  customization,
  size,
  shape,
  border,
  borderColor = "#fff",
  className = "",
}: {
  personal: PersonalInfo;
  customization: Customization;
  /** overrides customization.photoSize when set */
  size?: number | string;
  /** overrides customization.photoShape when set */
  shape?: "circle" | "rounded" | "square";
  /** overrides customization.photoBorder when set */
  border?: boolean;
  borderColor?: string;
  className?: string;
}) {
  if (!customization.showPhoto) return null;
  const resolvedShape = shape ?? customization.photoShape;
  const resolvedSize = size ?? customization.photoSize ?? 96;
  const resolvedBorder = border ?? customization.photoBorder;
  const radius = photoRadius(resolvedShape);
  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        borderRadius: radius,
        border: resolvedBorder ? `2.5px solid ${borderColor}` : undefined,
        backgroundColor: "#0F2942",
        boxShadow: resolvedBorder
          ? `0 0 0 4px ${borderColor}22`
          : "0 6px 18px rgba(15, 41, 66, 0.12)",
      }}
    >
      <img
        src={resumePhotoSrc(personal)}
        alt={personal.fullName ? `${personal.fullName} photo` : "Profile photo"}
        className="h-full w-full"
        style={photoImgStyle(personal)}
      />
    </div>
  );
}

export function RichHtml({
  html,
  className,
  style,
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!hasText(html)) return null;
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Section-heading text transform from Customize. */
export function headingTextTransform(
  customization?: Customization,
): NonNullable<React.CSSProperties["textTransform"]> {
  return customization?.capitalization ?? "uppercase";
}

/** textTransform + letterSpacing for section headings (respects Customize). */
export function headingCapStyle(
  customization?: Customization,
): React.CSSProperties {
  const transform = headingTextTransform(customization);
  const tracking =
    customization?.headingsLetterSpacing ??
    (transform === "uppercase" ? 1.1 : 0.2);
  return {
    textTransform: transform,
    letterSpacing: `${tracking}px`,
  };
}

export function AtsHeading({
  title,
  color,
  size = 11,
  rule = true,
  ruleColor,
  ruleWidth = 36,
  customization,
}: {
  title: string;
  color?: string;
  size?: number;
  rule?: boolean;
  ruleColor?: string;
  /** Short accent tick (default) or `"full"` for a hairline across the column. */
  ruleWidth?: number | "full";
  customization?: Customization;
}) {
  const border = customization?.headingBorder ?? "none";
  const showLineToggle = customization
    ? customization.toggles.headingsLine
    : true;
  const ink =
    color ||
    (customization?.toggles.headings && customization.accentColor
      ? customization.accentColor
      : "inherit");
  const barColor =
    ruleColor ||
    (customization?.toggles.headings ? customization.accentColor : color) ||
    "currentColor";
  const boxColor =
    typeof ink === "string" && ink !== "inherit"
      ? ink
      : customization?.accentColor || ATS.navy;
  const gap = customization?.elementSpacing ?? 12;
  const isFilled = border === "filled";
  const isOutline = border === "outline";
  const isLongLine = border === "line";
  const isUnderline = border === "underline";
  const showShortRule =
    rule &&
    showLineToggle &&
    (border === "none" || border === "line");

  const titleStyle: React.CSSProperties = {
    fontSize: size,
    color: isFilled ? contrastOn(boxColor) : ink,
    backgroundColor: isFilled ? boxColor : undefined,
    border: isOutline ? `1px solid ${boxColor}` : undefined,
    padding: isFilled || isOutline ? "3px 8px" : undefined,
    borderRadius: isFilled ? 4 : undefined,
    display: isFilled || isOutline ? "inline-block" : undefined,
    ...headingCapStyle(customization),
  };

  if (isLongLine && rule && !showLineToggle) {
    return (
      <div className="flex items-center gap-2" style={{ marginBottom: gap }}>
        <h2 className="shrink-0 font-bold" style={titleStyle}>
          {title}
        </h2>
        <span className="h-px min-w-4 flex-1" style={{ backgroundColor: barColor }} />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: gap }}>
      <h2 className="font-bold" style={titleStyle}>
        {title}
      </h2>
      {(isUnderline || showShortRule) && (
        <div
          className={
            isUnderline || ruleWidth === "full"
              ? "mt-1.5 h-px w-full"
              : "mt-1.5 h-[2px] rounded-full"
          }
          style={{
            width:
              isUnderline || ruleWidth === "full" ? "100%" : ruleWidth,
            backgroundColor: barColor,
          }}
        />
      )}
    </div>
  );
}

export function JobBlock({
  job,
  ink,
  muted,
  dateFmt = "monthYear",
  titleFirst = true,
}: {
  job: JobLike;
  ink: string;
  muted: string;
  dateFmt?: Customization["dateFormat"];
  titleFirst?: boolean;
}) {
  const primary = titleFirst ? job.jobTitle : job.company || job.jobTitle;
  const secondary = titleFirst
    ? [job.company, job.location].filter(Boolean).join(" · ")
    : job.jobTitle;
  return (
    <div className="text-[0.9em]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold" style={{ color: ink }}>
          {primary}
        </p>
        <p
          className="shrink-0 text-[0.92em] tabular-nums"
          style={{ color: muted }}
        >
          {dateRange(job, dateFmt)}
        </p>
      </div>
      {secondary && (
        <p className="mt-0.5 font-medium" style={{ color: muted }}>
          {secondary}
        </p>
      )}
      <RichHtml
        html={job.description}
        className="rte-content mt-1.5 leading-relaxed"
        style={{ color: ink }}
      />
    </div>
  );
}

/** Education entry with school, degree/field, dates, GPA, description. */
export function EducationBlock({
  edu,
  muted,
  ink,
  dateFmt = "monthYear",
  accent,
}: {
  edu: EducationItem;
  muted: string;
  ink?: string;
  dateFmt?: Customization["dateFormat"];
  accent?: string;
}) {
  return (
    <div className="text-[0.9em]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold">{edu.school}</p>
        <p className="shrink-0 tabular-nums" style={{ color: muted }}>
          {dateRange(edu, dateFmt)}
        </p>
      </div>
      {(edu.degree || edu.field) && (
        <p className="font-medium" style={{ color: accent || muted }}>
          {[edu.degree, edu.field].filter(Boolean).join(" - ")}
        </p>
      )}
      {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
      <RichHtml
        html={edu.description}
        className="rte-content mt-1 text-[0.95em] leading-relaxed"
        style={{ color: ink || muted }}
      />
    </div>
  );
}

export function LanguagesBlock({
  languages,
  muted,
  light = false,
  showLevel = true,
}: {
  languages: LanguageItem[];
  muted?: string;
  light?: boolean;
  showLevel?: boolean;
}) {
  if (languages.length === 0) return null;
  return (
    <ul
      className="space-y-1.5 text-[0.85em]"
      style={{ color: light ? undefined : muted }}
    >
      {languages.map((l, i) => {
        const level = showLevel ? languageLabel(l.level) : "";
        return (
          <li key={listKey(l.id, i, "lang")}>
            {l.name}
            {level ? ` - ${level}` : ""}
          </li>
        );
      })}
    </ul>
  );
}

export function ReferencesBlock({
  references,
  includeReferences,
  muted,
  max,
}: {
  references: ReferenceItem[];
  includeReferences: boolean;
  muted: string;
  max?: number;
}) {
  if (!includeReferences || references.length === 0) return null;
  const list = max ? references.slice(0, max) : references;
  return (
    <div className="grid grid-cols-2 gap-4 text-[0.85em]">
      {list.map((r, i) => (
        <div key={listKey(r.id, i, "ref")}>
          <p className="font-bold">{r.name}</p>
          <p style={{ color: muted }}>
            {[r.jobTitle, r.company].filter(Boolean).join(" · ")}
          </p>
          {r.phone && <p style={{ color: muted }}>{r.phone}</p>}
          {r.email && <p style={{ color: muted }}>{r.email}</p>}
        </div>
      ))}
    </div>
  );
}

export function SkillsList({
  skills,
  customization,
  muted,
  light = false,
  fill,
}: {
  skills: Resume["skills"];
  customization: Customization;
  muted?: string;
  light?: boolean;
  fill?: string;
}) {
  if (skills.length === 0) return null;
  const asList = customization.skillsDisplay === "list";
  if (asList) {
    const tick = light ? "#fff" : fill || customization.accentColor || ATS.navy;
    return (
      <ul
        className="space-y-1.5 text-[0.85em]"
        style={{ color: light ? undefined : muted }}
      >
        {skills.map((s, i) => (
          <li key={listKey(s.id, i, "skill")} className="flex items-start gap-2">
            <span
              className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: tick }}
            />
            <span>{s.name}</span>
          </li>
        ))}
      </ul>
    );
  }
  const dotFill = fill || customization.accentColor || ATS.navy;
  const empty = light ? "rgba(255,255,255,0.35)" : "#CBD5E1";
  return (
    <div className="space-y-2 text-[0.85em]">
      {skills.map((s, i) => {
        const filled = clampedLevel(s.level);
        return (
          <div key={listKey(s.id, i, "skill")}>
            <p className="mb-1" style={{ color: light ? undefined : muted }}>
              {s.name}
            </p>
            <div
              className="flex gap-[3px]"
              aria-label={`${s.name} ${filled} of 5`}
            >
              {Array.from({ length: 5 }).map((_, dot) => (
                <span
                  key={dot}
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      dot < filled ? (light ? "#fff" : dotFill) : empty,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type LayoutProps = {
  resume: Resume;
  pageWidthPx: number;
  pageHeightPx: number;
  /**
   * When true the layout grows with content (for multi-page measurement /
   * windowed pages) instead of clipping to a single pageHeightPx box.
   */
  expandHeight?: boolean;
  /** 0-based page index when rendering a paginated special layout */
  pageIndex?: number;
  totalPages?: number;
};

/** Root box sizing shared by every special layout. */
export function layoutShellStyle(
  customization: Customization,
  pageWidthPx: number,
  pageHeightPx: number,
  expandHeight = false,
  fallbackBg = "#FFFFFF",
): React.CSSProperties {
  return {
    width: pageWidthPx,
    ...(expandHeight
      ? { minHeight: pageHeightPx, height: "auto" as const }
      : { height: pageHeightPx }),
    overflow: expandHeight ? "visible" : "hidden",
    ...layoutPageStyle(customization, fallbackBg),
  };
}
