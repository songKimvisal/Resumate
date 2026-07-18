import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Flag,
  Briefcase,
  Globe,
  Contact,
  SquareCode,
  GitBranch,
  MessageCircle,
  Send,
  IdCard,
  type LucideIcon,
} from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import {
  NO_EXPERIENCE_TYPE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  SKILL_LEVEL_LABELS,
  type Customization,
  type ExperienceItem,
  type NoExperienceItem,
  type EducationItem,
  type LinkItem,
  type PersonalInfo,
  type SkillItem,
  type LanguageItem,
  type ReferenceItem,
} from "../../types/resume";
import { photoImgStyle } from "../../lib/photoFit";
import { cssFontStack } from "../../lib/fonts";
import { marginPercentCss } from "../../lib/pageSize";
import { idealTextColor } from "../../lib/color";
import { orderedMainGroups, orderedSidebarKeys } from "../../lib/sectionOrder";
import { cn } from "../../lib/utils";

function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

const fontSizes = { small: "13px", medium: "14.5px", large: "16px" } as const;
function hasText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

interface RichTextFragment {
  html: string;
  tag: string;
}

function splitRichText(html: string): RichTextFragment[] {
  const container = document.createElement("div");
  container.innerHTML = html;
  const fragments: RichTextFragment[] = [];
  Array.from(container.children).forEach((el) => {
    if (
      (el.tagName === "UL" || el.tagName === "OL") &&
      el.children.length > 1
    ) {
      Array.from(el.children).forEach((li) => {
        const wrapper = document.createElement(el.tagName);
        wrapper.appendChild(li.cloneNode(true));
        fragments.push({ html: wrapper.outerHTML, tag: el.tagName });
      });
    } else {
      fragments.push({ html: el.outerHTML, tag: el.tagName });
    }
  });
  return fragments.length > 0 ? fragments : [{ html, tag: "" }];
}

interface Block {
  key: string;
  gapBefore: number;
  node: React.ReactNode;
}
const SIDEBAR_WIDTH_FRACTION = 0.34;
interface Theme {
  accent: string;
  fontSize: string;
  fontFamily: string;
  lineHeight: number;
  gapSection: number;
  gapExpItem: number;
  gapEduItem: number;
  textTransform: "uppercase" | "capitalize";
  headingBorder: "none" | "outline" | "filled";
  showHeadingLine: boolean;
  showHeadingTitle: boolean;
  headingSizePx: number;
  headingTextColor: string;
  headingBgColor: string;
  bodyTextColor: string;
  bodyAccentColor: string;
  linkStyle: "underline" | "color" | "icon";
  showDates: boolean;
  showLinkIcons: boolean;
  showHeaderIcons: boolean;
  showDots: boolean;
}

function useTheme(customization: Customization): Theme {
  return useMemo(() => {
    // "single" palette mode derives heading/body accent surfaces from the
    // one accent pick without ever touching the independent multi-mode
    // fields in the store — switching modes never discards an edit, it just
    // changes which values are in effect
    const isSinglePalette = customization.paletteMode === "single";
    const headingBgColor = isSinglePalette
      ? customization.accentColor
      : customization.headingBgColor;
    const headingTextColor = isSinglePalette
      ? idealTextColor(customization.accentColor)
      : customization.headingTextColor;
    const bodyAccentColor = isSinglePalette
      ? customization.accentColor
      : customization.bodyAccentColor;

    return {
      accent: customization.accentColor,
      fontSize: fontSizes[customization.fontSize],
      fontFamily: cssFontStack(customization.fontFamily),
      lineHeight: customization.lineHeight,
      gapSection: customization.elementSpacing * (20 / 12),
      gapExpItem: customization.elementSpacing,
      gapEduItem: customization.elementSpacing * (10 / 12),
      textTransform: customization.capitalization,
      headingBorder: customization.headingBorder,
      showHeadingLine: customization.toggles.headingsLine,
      showHeadingTitle: customization.toggles.headings,
      headingSizePx: customization.headingsSize,
      headingTextColor,
      headingBgColor,
      bodyTextColor: customization.bodyTextColor,
      bodyAccentColor,
      linkStyle: customization.linkStyle,
      showDates: customization.toggles.dates,
      showLinkIcons:
        customization.toggles.linkIcons || customization.linkStyle === "icon",
      showHeaderIcons: customization.toggles.headerIcons,
      showDots: customization.toggles.dots,
    };
  }, [customization]);
}

export default function ResumePreview({
  pageLabelClassName = "text-text-secondary",
}: {
  pageLabelClassName?: string;
}) {
  const resume = useResumeStore((s) => s.resume);
  const {
    personal,
    experience,
    noExperience,
    education,
    skills,
    languages,
    references,
    includeReferences,
    customization,
  } = resume;
  const theme = useTheme(customization);
  const { accent, fontSize, gapSection, gapExpItem, gapEduItem } = theme;

  const pageAspect =
    customization.pageFormat === "letter" ? 11 / 8.5 : 297 / 210;
  const paddingTopBottomPct = marginPercentCss(
    customization.topBottomMargin,
    customization.pageFormat,
  );
  const paddingLeftRightPct = marginPercentCss(
    customization.leftRightMargin,
    customization.pageFormat,
  );

  // ---------- sidebar layout derived from `columns` + `headerPosition` ----------
  const showSidebar = customization.columns === "two";
  const headerInSidebar = showSidebar && customization.headerPosition !== "top";
  const topHeaderBanner = showSidebar && customization.headerPosition === "top";
  const listsInSidebar = showSidebar;
  const sidebarSide = headerInSidebar ? customization.headerPosition : "left";
  const headerTextColor =
    customization.colorLayout === "border"
      ? customization.bodyTextColor
      : theme.headingTextColor;
  const pageBackgroundColor =
    customization.colorLayout === "full"
      ? theme.headingBgColor
      : customization.bodyBgColor;

  const blocks = useMemo<Block[]>(() => {
    const list: Block[] = [];
    if (!showSidebar) {
      list.push({
        key: "header",
        gapBefore: 0,
        node: (
          <HeaderBlock
            personal={personal}
            customization={customization}
            theme={theme}
            textColor={headerTextColor}
          />
        ),
      });
    }

    if (hasText(personal.summary)) {
      const paraGap = parseFloat(fontSize) * 0.9 * 0.5;
      const fragments = splitRichText(personal.summary);
      fragments.forEach(({ html, tag }, i) => {
        const node = (
          <div
            className="rte-content text-[0.9em] leading-relaxed"
            style={{ color: theme.bodyTextColor }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        const adjacentParagraphs =
          i > 0 && tag === "P" && fragments[i - 1].tag === "P";
        list.push({
          key: `summary-${i}`,
          gapBefore: i === 0 ? gapSection : adjacentParagraphs ? paraGap : 0,
          node:
            i === 0 ? (
              <Section title="Summary" theme={theme}>
                {node}
              </Section>
            ) : (
              node
            ),
        });
      });
    }
    const expEduBlocks: Block[] = [];

    experience.forEach((exp, i) => {
      const header = <ExperienceHeader exp={exp} theme={theme} />;
      expEduBlocks.push({
        key: `exp-${exp.id}-header`,
        gapBefore: i === 0 ? gapSection : gapExpItem,
        node:
          i === 0 ? (
            <Section title="Experience" theme={theme}>
              {header}
            </Section>
          ) : (
            header
          ),
      });

      if (hasText(exp.description)) {
        const paraGap = parseFloat(fontSize) * 0.85 * 0.5;
        const fragments = splitRichText(exp.description);
        fragments.forEach(({ html, tag }, j) => {
          const adjacentParagraphs =
            j > 0 && tag === "P" && fragments[j - 1].tag === "P";
          expEduBlocks.push({
            key: `exp-${exp.id}-desc-${j}`,
            gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
            node: (
              <div
                className="rte-content text-[0.85em] leading-relaxed"
                style={{ color: theme.bodyTextColor }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ),
          });
        });
      }
    });

    if (experience.length === 0) {
      noExperience.forEach((exp, i) => {
        const header = <NoExperienceHeader exp={exp} theme={theme} />;
        expEduBlocks.push({
          key: `noexp-${exp.id}-header`,
          gapBefore: i === 0 ? gapSection : gapExpItem,
          node:
            i === 0 ? (
              <Section title="Experience" theme={theme}>
                {header}
              </Section>
            ) : (
              header
            ),
        });

        if (hasText(exp.description)) {
          const paraGap = parseFloat(fontSize) * 0.85 * 0.5;
          const fragments = splitRichText(exp.description);
          fragments.forEach(({ html, tag }, j) => {
            const adjacentParagraphs =
              j > 0 && tag === "P" && fragments[j - 1].tag === "P";
            expEduBlocks.push({
              key: `noexp-${exp.id}-desc-${j}`,
              gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
              node: (
                <div
                  className="rte-content text-[0.85em] leading-relaxed"
                  style={{ color: theme.bodyTextColor }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ),
            });
          });
        }
      });
    }

    education.forEach((edu, i) => {
      const header = <EducationEntry edu={edu} theme={theme} />;
      expEduBlocks.push({
        key: `edu-${edu.id}-header`,
        gapBefore: i === 0 ? gapSection : gapEduItem,
        node:
          i === 0 ? (
            <Section title="Education" theme={theme}>
              {header}
            </Section>
          ) : (
            header
          ),
      });

      if (hasText(edu.description)) {
        const paraGap = parseFloat(fontSize) * 0.85 * 0.5;
        const fragments = splitRichText(edu.description);
        fragments.forEach(({ html, tag }, j) => {
          const adjacentParagraphs =
            j > 0 && tag === "P" && fragments[j - 1].tag === "P";
          expEduBlocks.push({
            key: `edu-${edu.id}-desc-${j}`,
            gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
            node: (
              <div
                className="rte-content text-[0.85em] leading-relaxed"
                style={{ color: theme.bodyTextColor }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ),
          });
        });
      }
    });

    const skillsLanguageBlocks: Block[] = [];
    if (!listsInSidebar && (skills.length > 0 || languages.length > 0)) {
      skillsLanguageBlocks.push({
        key: "skills-languages",
        gapBefore: gapSection,
        node: (
          <div className="grid grid-cols-2 gap-6">
            {skills.length > 0 && (
              <Section title="Skills" theme={theme}>
                <SkillsBody skills={skills} theme={theme} accent={accent} />
              </Section>
            )}
            {languages.length > 0 && (
              <Section title="Languages" theme={theme}>
                <LanguagesBody
                  languages={languages}
                  theme={theme}
                  accent={accent}
                />
              </Section>
            )}
          </div>
        ),
      });
    }

    const referencesBlocks: Block[] = [];
    if (!listsInSidebar && includeReferences && references.length > 0) {
      referencesBlocks.push({
        key: "references",
        gapBefore: gapSection,
        node: (
          <Section title="References" theme={theme}>
            <div className="grid grid-cols-2 gap-4">
              {references.map((r) => (
                <ReferenceEntry key={r.id} r={r} theme={theme} />
              ))}
            </div>
          </Section>
        ),
      });
    }

    const groups: Record<
      "experience" | "skillsLanguage" | "references",
      Block[]
    > = {
      experience: expEduBlocks,
      skillsLanguage: skillsLanguageBlocks,
      references: referencesBlocks,
    };
    orderedMainGroups(customization.sectionOrder).forEach((g) =>
      list.push(...groups[g]),
    );

    return list;
  }, [
    personal,
    experience,
    noExperience,
    education,
    skills,
    languages,
    references,
    includeReferences,
    showSidebar,
    listsInSidebar,
    customization,
    theme,
    accent,
    fontSize,
    gapSection,
    gapExpItem,
    gapEduItem,
    headerTextColor,
  ]);

  // ---------- measure each block's rendered height, then paginate ----------
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  // width `heights` was measured at; ignore heights until this matches pageWidth
  const [measuredWidth, setMeasuredWidth] = useState(-1);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setPageWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const container = measureContainerRef.current;
    if (!container) return;
    const next: Record<string, number> = {};
    blocks.forEach((b, i) => {
      const child = container.children[i] as HTMLElement | undefined;
      if (child) next[b.key] = child.offsetHeight;
    });
    setHeights(next);
    setMeasuredWidth(pageWidth);
  }, [blocks, pageWidth]);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [bannerHeightPx, setBannerHeightPx] = useState(0);

  useLayoutEffect(() => {
    const el = bannerRef.current;
    if (!el) {
      setBannerHeightPx(0);
      return;
    }
    const update = () => setBannerHeightPx(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [topHeaderBanner]);

  const pages = useMemo(() => {
    if (pageWidth === 0 || measuredWidth !== pageWidth) return [blocks];
    const verticalPaddingPx = pageWidth * (paddingTopBottomPct / 100);
    const contentHeightPx = pageWidth * pageAspect - verticalPaddingPx * 2;
    const firstPageContentHeightPx = topHeaderBanner
      ? contentHeightPx - bannerHeightPx
      : contentHeightPx;

    const result: Block[][] = [[]];
    let used = 0;
    for (const b of blocks) {
      const h = heights[b.key] ?? 0;
      const currentPage = result[result.length - 1];
      const isFirstOnPage = currentPage.length === 0;
      const needed = (isFirstOnPage ? 0 : b.gapBefore) + h;
      const limit =
        result.length === 1 ? firstPageContentHeightPx : contentHeightPx;
      if (!isFirstOnPage && used + needed > limit) {
        result.push([b]);
        used = h;
      } else {
        currentPage.push(b);
        used += needed;
      }
    }
    return result;
  }, [
    blocks,
    heights,
    pageWidth,
    topHeaderBanner,
    bannerHeightPx,
    measuredWidth,
    pageAspect,
    paddingTopBottomPct,
  ]);
  const paddingTopBottomPx = pageWidth * (paddingTopBottomPct / 100);
  const paddingLeftRightPx = pageWidth * (paddingLeftRightPct / 100);
  const mainColumnWidthPx = showSidebar
    ? pageWidth * (1 - SIDEBAR_WIDTH_FRACTION)
    : pageWidth;

  return (
    <div ref={wrapperRef} className="space-y-4">
      <div
        ref={measureContainerRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: -99999,
          visibility: "hidden",
          pointerEvents: "none",
          width: pageWidth
            ? mainColumnWidthPx - paddingLeftRightPx * 2
            : undefined,
          fontSize,
          fontFamily: theme.fontFamily,
          lineHeight: theme.lineHeight,
        }}
      >
        {blocks.map((b) => (
          <div key={b.key}>{b.node}</div>
        ))}
      </div>

      {pages.map((pageBlocks, pageIndex) => (
        <div key={pageIndex}>
          {pages.length > 1 && (
            <p className={cn("mb-1.5 text-center text-xs", pageLabelClassName)}>
              Page {pageIndex + 1} of {pages.length}
            </p>
          )}
          <div
            className="shadow-xl rounded-sm w-full overflow-hidden"
            style={{
              fontSize,
              fontFamily: theme.fontFamily,
              lineHeight: theme.lineHeight,
              aspectRatio:
                customization.pageFormat === "letter" ? "8.5/11" : "210/297",
              backgroundColor: pageBackgroundColor,
              color: theme.bodyTextColor,
              border:
                customization.colorLayout === "border"
                  ? `4px solid ${theme.headingBgColor}`
                  : undefined,
            }}
          >
            <div className="h-full flex flex-col">
              {topHeaderBanner && pageIndex === 0 && (
                <div
                  ref={bannerRef}
                  style={{
                    paddingTop: paddingTopBottomPx,
                    paddingLeft: paddingLeftRightPx,
                    paddingRight: paddingLeftRightPx,
                    paddingBottom: gapSection,
                  }}
                >
                  <HeaderBlock
                    personal={personal}
                    customization={customization}
                    theme={theme}
                    textColor={headerTextColor}
                  />
                </div>
              )}
              <div
                className={
                  showSidebar
                    ? "flex-1 min-h-0 flex"
                    : "flex-1 min-h-0 overflow-hidden"
                }
                style={
                  showSidebar
                    ? undefined
                    : {
                        paddingTop: `${paddingTopBottomPct}%`,
                        paddingBottom: `${paddingTopBottomPct}%`,
                        paddingLeft: `${paddingLeftRightPct}%`,
                        paddingRight: `${paddingLeftRightPct}%`,
                      }
                }
              >
                {showSidebar && sidebarSide === "left" && (
                  <SidebarColumn
                    personal={personal}
                    customization={customization}
                    theme={theme}
                    accent={accent}
                    textColor={headerTextColor}
                    headerInSidebar={headerInSidebar}
                    listsInSidebar={listsInSidebar}
                    skills={skills}
                    languages={languages}
                    references={references}
                    includeReferences={includeReferences}
                    showContent={pageIndex === 0}
                    paddingTopBottomPx={paddingTopBottomPx}
                    paddingLeftRightPx={paddingLeftRightPx}
                  />
                )}
                <div
                  className={
                    showSidebar
                      ? "flex-1 min-w-0 h-full overflow-hidden"
                      : undefined
                  }
                  style={
                    showSidebar
                      ? {
                          paddingTop: paddingTopBottomPx,
                          paddingBottom: paddingTopBottomPx,
                          paddingLeft: paddingLeftRightPx,
                          paddingRight: paddingLeftRightPx,
                        }
                      : undefined
                  }
                >
                  {pageBlocks.map((b, i) => (
                    <div
                      key={b.key}
                      style={{ marginTop: i === 0 ? 0 : b.gapBefore }}
                    >
                      {b.node}
                    </div>
                  ))}
                </div>
                {showSidebar && sidebarSide === "right" && (
                  <SidebarColumn
                    personal={personal}
                    customization={customization}
                    theme={theme}
                    accent={accent}
                    textColor={headerTextColor}
                    headerInSidebar={headerInSidebar}
                    listsInSidebar={listsInSidebar}
                    skills={skills}
                    languages={languages}
                    references={references}
                    includeReferences={includeReferences}
                    showContent={pageIndex === 0}
                    paddingTopBottomPx={paddingTopBottomPx}
                    paddingLeftRightPx={paddingLeftRightPx}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsBody({
  skills,
  theme,
  accent,
}: {
  skills: SkillItem[];
  theme: Theme;
  accent: string;
}) {
  return theme.showDots ? (
    <div className="space-y-1">
      {skills
        .filter((s) => s.name)
        .map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2">
            <p className="text-[0.85em]" style={{ color: theme.bodyTextColor }}>
              {s.name}
            </p>
            <DotRow level={s.level} accent={accent} />
          </div>
        ))}
    </div>
  ) : (
    <p
      className="text-[0.85em] leading-relaxed"
      style={{ color: theme.bodyTextColor }}
    >
      {skills
        .map((s) =>
          s.name ? `${s.name} (${SKILL_LEVEL_LABELS[s.level - 1]})` : "",
        )
        .filter(Boolean)
        .join(" - ")}
    </p>
  );
}

function LanguagesBody({
  languages,
  theme,
  accent,
}: {
  languages: LanguageItem[];
  theme: Theme;
  accent: string;
}) {
  return theme.showDots ? (
    <div className="space-y-1">
      {languages
        .filter((l) => l.name)
        .map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2">
            <p className="text-[0.85em]" style={{ color: theme.bodyTextColor }}>
              {l.name}
            </p>
            <DotRow level={l.level} accent={accent} />
          </div>
        ))}
    </div>
  ) : (
    <p
      className="text-[0.85em] leading-relaxed"
      style={{ color: theme.bodyTextColor }}
    >
      {languages
        .map((l) =>
          l.name ? `${l.name} (${LANGUAGE_LEVEL_LABELS[l.level - 1]})` : "",
        )
        .filter(Boolean)
        .join(" - ")}
    </p>
  );
}

function ReferenceEntry({ r, theme }: { r: ReferenceItem; theme: Theme }) {
  return (
    <div className="text-[0.85em] leading-relaxed">
      <p className="font-semibold" style={{ color: theme.bodyTextColor }}>
        {r.name || "Reference name"}
      </p>
      <p style={{ color: theme.bodyAccentColor }}>
        {[r.jobTitle, r.company].filter(Boolean).join(", ")}
      </p>
      <p className="text-[0.9em]" style={{ color: theme.bodyAccentColor }}>
        {[r.email, r.phone].filter(Boolean).join(" - ")}
      </p>
    </div>
  );
}

function DotRow({ level, accent }: { level: number; accent: string }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="size-[0.5em] rounded-full"
          style={{ backgroundColor: i < level ? accent : "#e5e5e5" }}
        />
      ))}
    </div>
  );
}

function photoRadiusFor(shape: Customization["photoShape"]) {
  return shape === "circle" ? "9999px" : shape === "rounded" ? "16%" : "0px";
}

function contactItems(personal: PersonalInfo, theme: Theme) {
  const items: React.ReactNode[] = [];
  if (personal.phone)
    items.push(
      <IconText key="phone" icon="phone" theme={theme} isHeaderIcon>
        {personal.phone}
      </IconText>,
    );
  if (personal.email)
    items.push(
      <IconText key="email" icon="mail" theme={theme} isHeaderIcon>
        {personal.email}
      </IconText>,
    );
  if (personal.location)
    items.push(
      <IconText key="location" icon="pin" theme={theme} isHeaderIcon>
        {personal.location}
      </IconText>,
    );
  if (personal.nationality)
    items.push(
      <IconText key="nationality" icon="flag" theme={theme} isHeaderIcon>
        {personal.nationality}
      </IconText>,
    );
  personal.portfolio.forEach((entry) =>
    items.push(
      <LinkText key={entry.id} icon="briefcase" entry={entry} theme={theme} />,
    ),
  );
  personal.website.forEach((entry) =>
    items.push(
      <LinkText key={entry.id} icon="globe" entry={entry} theme={theme} />,
    ),
  );
  personal.linkedin.forEach((entry) =>
    items.push(
      <LinkText key={entry.id} icon="linkedin" entry={entry} theme={theme} />,
    ),
  );
  personal.github.forEach((entry) =>
    items.push(
      <LinkText key={entry.id} icon="github" entry={entry} theme={theme} />,
    ),
  );
  personal.gitlab.forEach((entry) =>
    items.push(
      <LinkText key={entry.id} icon="gitlab" entry={entry} theme={theme} />,
    ),
  );
  personal.stackoverflow.forEach((entry) =>
    items.push(
      <LinkText
        key={entry.id}
        icon="stackoverflow"
        entry={entry}
        theme={theme}
      />,
    ),
  );
  personal.telegram.forEach((entry) =>
    items.push(
      <LinkText key={entry.id} icon="send" entry={entry} theme={theme} />,
    ),
  );
  if (personal.passportId)
    items.push(
      <IconText key="passport" icon="id" theme={theme} isHeaderIcon>
        {personal.passportId}
      </IconText>,
    );
  return items;
}

function HeaderBlock({
  personal,
  customization,
  theme,
  textColor,
}: {
  personal: PersonalInfo;
  customization: Customization;
  theme: Theme;
  textColor: string;
}) {
  const showPhoto = customization.showPhoto && !!personal.photoUrl;
  const isFilled = customization.colorLayout === "column";

  return (
    <header
      className="text-center space-y-2"
      style={{
        backgroundColor: isFilled ? theme.headingBgColor : undefined,
      }}
    >
      {showPhoto && (
        <div
          className="overflow-hidden mx-auto"
          style={{
            width: customization.photoSize,
            height: customization.photoSize,
            borderRadius: photoRadiusFor(customization.photoShape),
          }}
        >
          <img src={personal.photoUrl} alt="" style={photoImgStyle(personal)} />
        </div>
      )}
      <h1
        className="font-bold leading-tight"
        style={{ fontSize: customization.fullNameSize, color: textColor }}
      >
        {personal.fullName || "Your Name"}
      </h1>
      {customization.toggles.jobTitle && (
        <p
          className="font-medium"
          style={{ fontSize: customization.titleSize, color: theme.accent }}
        >
          {personal.jobTitle || "Job Title"}
        </p>
      )}
      <div
        className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.8em] pt-1"
        style={{ color: textColor }}
      >
        {contactItems(personal, theme)}
      </div>
    </header>
  );
}
function SidebarHeaderBlock({
  personal,
  customization,
  theme,
  textColor,
}: {
  personal: PersonalInfo;
  customization: Customization;
  theme: Theme;
  textColor: string;
}) {
  const showPhoto = customization.showPhoto && !!personal.photoUrl;

  return (
    <header className="text-center space-y-2">
      {showPhoto && (
        <div
          className="overflow-hidden mx-auto"
          style={{
            width: customization.photoSize,
            height: customization.photoSize,
            borderRadius: photoRadiusFor(customization.photoShape),
          }}
        >
          <img src={personal.photoUrl} alt="" style={photoImgStyle(personal)} />
        </div>
      )}
      <h1
        className="font-bold leading-tight"
        style={{ fontSize: customization.fullNameSize, color: textColor }}
      >
        {personal.fullName || "Your Name"}
      </h1>
      {customization.toggles.jobTitle && (
        <p
          className="font-medium"
          style={{ fontSize: customization.titleSize, color: theme.accent }}
        >
          {personal.jobTitle || "Job Title"}
        </p>
      )}
      <div
        className="flex flex-col items-start gap-1.5 text-[0.8em] pt-1 text-left"
        style={{ color: textColor }}
      >
        {contactItems(personal, theme)}
      </div>
    </header>
  );
}
function SidebarColumn({
  personal,
  customization,
  theme,
  accent,
  textColor,
  headerInSidebar,
  listsInSidebar,
  skills,
  languages,
  references,
  includeReferences,
  showContent,
  paddingTopBottomPx,
  paddingLeftRightPx,
}: {
  personal: PersonalInfo;
  customization: Customization;
  theme: Theme;
  accent: string;
  textColor: string;
  headerInSidebar: boolean;
  listsInSidebar: boolean;
  skills: SkillItem[];
  languages: LanguageItem[];
  references: ReferenceItem[];
  includeReferences: boolean;
  showContent: boolean;
  paddingTopBottomPx: number;
  paddingLeftRightPx: number;
}) {
  const isFilled = customization.colorLayout === "column";

  return (
    <div
      className="h-full shrink-0 overflow-hidden"
      style={{
        width: `${SIDEBAR_WIDTH_FRACTION * 100}%`,
        backgroundColor: isFilled ? theme.headingBgColor : undefined,
      }}
    >
      {showContent && (
        <div
          className="space-y-5"
          style={{
            paddingTop: paddingTopBottomPx,
            paddingBottom: paddingTopBottomPx,
            paddingLeft: paddingLeftRightPx,
            paddingRight: paddingLeftRightPx,
          }}
        >
          {headerInSidebar && (
            <SidebarHeaderBlock
              personal={personal}
              customization={customization}
              theme={theme}
              textColor={textColor}
            />
          )}
          {listsInSidebar &&
            orderedSidebarKeys(customization.sectionOrder).map((key) => {
              if (key === "skills" && skills.length > 0) {
                return (
                  <Section key="skills" title="Skills" theme={theme}>
                    <SkillsBody skills={skills} theme={theme} accent={accent} />
                  </Section>
                );
              }
              if (key === "language" && languages.length > 0) {
                return (
                  <Section key="language" title="Languages" theme={theme}>
                    <LanguagesBody
                      languages={languages}
                      theme={theme}
                      accent={accent}
                    />
                  </Section>
                );
              }
              if (
                key === "references" &&
                includeReferences &&
                references.length > 0
              ) {
                return (
                  <Section key="references" title="References" theme={theme}>
                    <div className="space-y-3">
                      {references.map((r) => (
                        <ReferenceEntry key={r.id} r={r} theme={theme} />
                      ))}
                    </div>
                  </Section>
                );
              }
              return null;
            })}
        </div>
      )}
    </div>
  );
}

function ExperienceHeader({
  exp,
  theme,
}: {
  exp: ExperienceItem;
  theme: Theme;
}) {
  return (
    <div className="flex justify-between gap-3 items-baseline">
      <p
        className="font-semibold text-[0.95em]"
        style={{ color: theme.bodyTextColor }}
      >
        {exp.jobTitle || "Job title"}
        {(exp.company || exp.location) && (
          <span
            className="font-normal"
            style={{ color: theme.bodyAccentColor }}
          >
            {" "}
            - {[exp.company, exp.location].filter(Boolean).join(", ")}
          </span>
        )}
      </p>
      {theme.showDates && (
        <p
          className="text-[0.78em] whitespace-nowrap"
          style={{ color: theme.bodyAccentColor }}
        >
          {fmtDate(exp.startDate)}
          {(exp.startDate || exp.endDate || exp.current) && " – "}
          {exp.current ? "Present" : fmtDate(exp.endDate)}
        </p>
      )}
    </div>
  );
}

function NoExperienceHeader({
  exp,
  theme,
}: {
  exp: NoExperienceItem;
  theme: Theme;
}) {
  const hasUrl = exp.url.trim() !== "";
  return (
    <div className="flex justify-between gap-3 items-baseline">
      <p
        className="font-semibold text-[0.95em]"
        style={{ color: theme.bodyTextColor }}
      >
        {NO_EXPERIENCE_TYPE_LABELS[exp.type]}
        {(exp.title || exp.subtitle) && (
          <span
            className="font-normal"
            style={{ color: theme.bodyAccentColor }}
          >
            {" "}
            -{" "}
            {exp.title &&
              (hasUrl ? (
                <a
                  href={exp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {exp.title}
                </a>
              ) : (
                exp.title
              ))}
            {exp.title && exp.subtitle && ", "}
            {exp.subtitle}
          </span>
        )}
      </p>
      {theme.showDates && (
        <p
          className="text-[0.78em] whitespace-nowrap"
          style={{ color: theme.bodyAccentColor }}
        >
          {fmtDate(exp.startDate)}
          {(exp.startDate || exp.endDate || exp.current) && " – "}
          {exp.current ? "Present" : fmtDate(exp.endDate)}
        </p>
      )}
    </div>
  );
}

function EducationEntry({ edu, theme }: { edu: EducationItem; theme: Theme }) {
  return (
    <div className="flex justify-between gap-3">
      <div>
        <p
          className="font-semibold text-[0.95em]"
          style={{ color: theme.bodyTextColor }}
        >
          {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
        </p>
        <p className="text-[0.85em]" style={{ color: theme.bodyAccentColor }}>
          {[edu.school, edu.gpa && `GPA: ${edu.gpa}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {theme.showDates && (
        <p
          className="text-[0.78em] whitespace-nowrap"
          style={{ color: theme.bodyAccentColor }}
        >
          {fmtDate(edu.startDate)}
          {(edu.startDate || edu.endDate || edu.current) && " – "}
          {edu.current ? "Present" : fmtDate(edu.endDate)}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: Theme;
  children: React.ReactNode;
}) {
  const isFilled = theme.headingBorder === "filled";
  const isOutline = theme.headingBorder === "outline";
  const headingStyle: React.CSSProperties = {
    color: isFilled ? "#fff" : theme.accent,
    fontSize: theme.headingSizePx,
    textTransform: theme.textTransform,
    backgroundColor: isFilled ? theme.accent : undefined,
    borderColor: theme.accent,
    borderWidth: isOutline
      ? 1
      : theme.showHeadingLine && !isFilled
        ? undefined
        : 0,
    borderStyle: isOutline ? "solid" : undefined,
    borderBottomWidth:
      !isOutline && !isFilled ? (theme.showHeadingLine ? 1 : 0) : undefined,
    padding: isOutline || isFilled ? "3px 8px" : undefined,
    borderRadius: isFilled ? 4 : undefined,
  };

  return (
    <section>
      {theme.showHeadingTitle && (
        <h2
          className="font-bold tracking-[0.18em] pb-1 mb-2 inline-block"
          style={headingStyle}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

const icons: Record<string, LucideIcon> = {
  phone: Phone,
  mail: Mail,
  pin: MapPin,
  flag: Flag,
  briefcase: Briefcase,
  globe: Globe,
  linkedin: Contact,
  github: SquareCode,
  gitlab: GitBranch,
  stackoverflow: MessageCircle,
  send: Send,
  id: IdCard,
};

function LinkText({
  icon,
  entry,
  theme,
}: {
  icon: keyof typeof icons;
  entry: LinkItem;
  theme: Theme;
}) {
  if (!entry.title.trim()) return null;
  return (
    <IconText icon={icon} theme={theme}>
      {entry.url ? (
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className={theme.linkStyle === "underline" ? "underline" : undefined}
          style={
            theme.linkStyle === "color" ? { color: theme.accent } : undefined
          }
        >
          {entry.title}
        </a>
      ) : (
        entry.title
      )}
    </IconText>
  );
}

function IconText({
  icon,
  children,
  theme,
  isHeaderIcon,
}: {
  icon: keyof typeof icons;
  children: React.ReactNode;
  theme: Theme;
  isHeaderIcon?: boolean;
}) {
  const Icon = icons[icon];
  const showIcon = isHeaderIcon ? theme.showHeaderIcons : theme.showLinkIcons;
  return (
    <span className="inline-flex items-center gap-1.5">
      {showIcon && <Icon size="1em" strokeWidth={1.8} className="shrink-0" />}
      {children}
    </span>
  );
}
