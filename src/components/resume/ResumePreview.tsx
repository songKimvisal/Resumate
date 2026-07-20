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
  FileText,
  GraduationCap,
  Sparkles,
  Languages as LanguagesIcon,
  Users,
  Link as LinkGlyph,
  type LucideIcon,
} from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import {
  NO_EXPERIENCE_TYPE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  SKILL_LEVEL_LABELS,
  type Customization,
  type SectionOrderKey,
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
import { marginPercentCss, PAGE_SIZE_MM } from "../../lib/pageSize";
import {
  orderedMainGroups,
  partitionSectionOrder,
} from "../../lib/sectionOrder";
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
  accentText: string;
  fontSize: string;
  fontFamily: string;
  lineHeight: number;
  gapSection: number;
  gapExpItem: number;
  gapEduItem: number;
  textTransform: "uppercase" | "capitalize";
  headingBorder: "none" | "outline" | "filled" | "line" | "underline";
  showHeadingLine: boolean;
  headingsAccentOn: boolean;
  headingSizePx: number;
  bodyTextColor: string;
  bodyAccentColor: string;
  linkStyle: ("underline" | "color" | "icon")[];
  sectionIcon: "none" | "outline" | "filled";
  headerAlignment: "left" | "center";
  contactArrangement: "inline" | "stacked";
  contactSeparator: "icon" | "bullet" | "bar";
  iconStyle: "plain" | "filled" | "outline" | "square" | "faded";
  datesAccentOn: boolean;
  showLinkIcons: boolean;
  showHeaderIcons: boolean;
  showDots: boolean;
}

function useTheme(customization: Customization): Theme {
  return useMemo(() => {
    return {
      accent: customization.accentColor,
      accentText: customization.accentColor,
      fontSize: fontSizes[customization.fontSize],
      fontFamily: cssFontStack(customization.fontFamily),
      lineHeight: customization.lineHeight,
      gapSection: customization.elementSpacing * (20 / 12),
      gapExpItem: customization.elementSpacing,
      gapEduItem: customization.elementSpacing * (10 / 12),
      textTransform: customization.capitalization,
      headingBorder: customization.headingBorder,
      showHeadingLine: customization.toggles.headingsLine,
      headingsAccentOn: customization.toggles.headings,
      headingSizePx: customization.headingsSize,
      bodyTextColor: customization.bodyTextColor,
      bodyAccentColor: customization.accentColor,
      linkStyle: customization.linkStyle,
      sectionIcon: customization.sectionIcon,
      headerAlignment: customization.headerAlignment,
      contactArrangement: customization.contactArrangement,
      contactSeparator: customization.contactSeparator,
      iconStyle: customization.iconStyle,
      datesAccentOn: customization.toggles.dates,
      showLinkIcons:
        customization.toggles.linkIcons ||
        customization.linkStyle.includes("icon"),
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
  const sidebarSide = headerInSidebar ? customization.headerPosition : "left";
  const { main: mainSectionKeys, sidebar: sidebarSectionKeys } = useMemo(
    () =>
      showSidebar
        ? partitionSectionOrder(
            customization.sectionOrder,
            customization.sidebarKeys,
          )
        : {
            main: customization.sectionOrder,
            sidebar: [] as SectionOrderKey[],
          },
    [showSidebar, customization.sectionOrder, customization.sidebarKeys],
  );
  const sidebarHasContent = (key: SectionOrderKey) => {
    if (key === "skills") return skills.length > 0;
    if (key === "language") return languages.length > 0;
    if (key === "references") return includeReferences && references.length > 0;
    if (key === "experience")
      return (
        experience.length > 0 || noExperience.length > 0 || education.length > 0
      );
    return false;
  };
  const sidebarColumnVisible =
    showSidebar &&
    (headerInSidebar || sidebarSectionKeys.some(sidebarHasContent));
  const headerTextColor = customization.bodyTextColor;
  const pageBackgroundColor = customization.bodyBgColor;

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

    if (!showSidebar) {
      const skillsLanguageBlocks: Block[] = [];
      if (skills.length > 0 || languages.length > 0) {
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
      if (includeReferences && references.length > 0) {
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
    } else {
      // two-column mode: each of the 4 movable sections is independently
      // placed, so only the ones the user left in the main column land here
      // — whatever's in `sidebarSectionKeys` renders inside SidebarColumn
      const skillsBlocks: Block[] = [];
      if (skills.length > 0) {
        skillsBlocks.push({
          key: "skills",
          gapBefore: gapSection,
          node: (
            <Section title="Skills" theme={theme}>
              <SkillsBody skills={skills} theme={theme} accent={accent} />
            </Section>
          ),
        });
      }

      const languageBlocks: Block[] = [];
      if (languages.length > 0) {
        languageBlocks.push({
          key: "language",
          gapBefore: gapSection,
          node: (
            <Section title="Languages" theme={theme}>
              <LanguagesBody
                languages={languages}
                theme={theme}
                accent={accent}
              />
            </Section>
          ),
        });
      }

      const referencesBlocks: Block[] = [];
      if (includeReferences && references.length > 0) {
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

      const keyBlocks: Record<SectionOrderKey, Block[]> = {
        skills: skillsBlocks,
        language: languageBlocks,
        references: referencesBlocks,
        experience: expEduBlocks,
      };
      mainSectionKeys.forEach((key) => list.push(...keyBlocks[key]));
    }

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
    mainSectionKeys,
    customization,
    theme,
    accent,
    fontSize,
    gapSection,
    gapExpItem,
    gapEduItem,
    headerTextColor,
  ]);
  const pxPerMm = 96 / 25.4;
  const realPageWidthPx =
    PAGE_SIZE_MM[customization.pageFormat].width * pxPerMm;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [measuredWidth, setMeasuredWidth] = useState(-1);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
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
    setMeasuredWidth(realPageWidthPx);
  }, [blocks, realPageWidthPx]);
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
    if (measuredWidth !== realPageWidthPx) return [blocks];
    const verticalPaddingPx = realPageWidthPx * (paddingTopBottomPct / 100);
    const contentHeightPx =
      realPageWidthPx * pageAspect - verticalPaddingPx * 2;
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
    realPageWidthPx,
    topHeaderBanner,
    bannerHeightPx,
    measuredWidth,
    pageAspect,
    paddingTopBottomPct,
  ]);
  const paddingTopBottomPx = realPageWidthPx * (paddingTopBottomPct / 100);
  const paddingLeftRightPx = realPageWidthPx * (paddingLeftRightPct / 100);
  const mainColumnWidthPx = sidebarColumnVisible
    ? realPageWidthPx * (1 - SIDEBAR_WIDTH_FRACTION)
    : realPageWidthPx;
  const pageHeightPx = realPageWidthPx * pageAspect;
  const scaleFactor =
    containerWidth > 0 ? Math.min(1, containerWidth / realPageWidthPx) : 1;

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
          width: mainColumnWidthPx - paddingLeftRightPx * 2,
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
            className="relative shadow-xl rounded-sm w-full"
            style={{
              maxWidth: realPageWidthPx,
              aspectRatio:
                customization.pageFormat === "letter" ? "8.5/11" : "210/297",
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-sm">
              <div
                style={{
                  width: realPageWidthPx,
                  height: pageHeightPx,
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: "top left",
                  fontSize,
                  fontFamily: theme.fontFamily,
                  lineHeight: theme.lineHeight,
                  backgroundColor: pageBackgroundColor,
                  color: theme.bodyTextColor,
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
                      sidebarColumnVisible
                        ? "flex-1 min-h-0 flex"
                        : "flex-1 min-h-0 overflow-hidden"
                    }
                    style={
                      sidebarColumnVisible
                        ? undefined
                        : {
                            paddingTop: `${paddingTopBottomPct}%`,
                            paddingBottom: `${paddingTopBottomPct}%`,
                            paddingLeft: `${paddingLeftRightPct}%`,
                            paddingRight: `${paddingLeftRightPct}%`,
                          }
                    }
                  >
                    {sidebarColumnVisible && sidebarSide === "left" && (
                      <SidebarColumn
                        personal={personal}
                        customization={customization}
                        theme={theme}
                        accent={accent}
                        textColor={headerTextColor}
                        headerInSidebar={headerInSidebar}
                        sidebarSectionKeys={sidebarSectionKeys}
                        experience={experience}
                        noExperience={noExperience}
                        education={education}
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
                        sidebarColumnVisible
                          ? "flex-1 min-w-0 h-full overflow-hidden"
                          : undefined
                      }
                      style={
                        sidebarColumnVisible
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
                    {sidebarColumnVisible && sidebarSide === "right" && (
                      <SidebarColumn
                        personal={personal}
                        customization={customization}
                        theme={theme}
                        accent={accent}
                        textColor={headerTextColor}
                        headerInSidebar={headerInSidebar}
                        sidebarSectionKeys={sidebarSectionKeys}
                        experience={experience}
                        noExperience={noExperience}
                        education={education}
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
function withContactSeparators(
  items: React.ReactNode[],
  theme: Theme,
): React.ReactNode[] {
  const glyph = theme.contactSeparator === "bullet" ? "•" : "|";
  const out: React.ReactNode[] = [];
  items.forEach((item, i) => {
    if (i > 0) {
      out.push(
        <span key={`sep-${i}`} aria-hidden="true" className="opacity-50">
          {glyph}
        </span>,
      );
    }
    out.push(item);
  });
  return out;
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
  const isLeft = theme.headerAlignment === "left";
  const isStacked = theme.contactArrangement === "stacked";
  const useContactSeparator = !isStacked && theme.contactSeparator !== "icon";
  const contactTheme = useContactSeparator
    ? { ...theme, showHeaderIcons: false, showLinkIcons: false }
    : theme;

  return (
    <header className={cn("space-y-2", isLeft ? "text-left" : "text-center")}>
      {showPhoto && (
        <div
          className={cn("overflow-hidden", !isLeft && "mx-auto")}
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
        style={{
          fontSize: customization.fullNameSize,
          color: customization.toggles.fullName ? theme.accentText : textColor,
        }}
      >
        {personal.fullName || "Your Name"}
      </h1>
      <p
        className="font-medium"
        style={{
          fontSize: customization.titleSize,
          color: customization.toggles.jobTitle ? theme.accentText : textColor,
        }}
      >
        {personal.jobTitle || "Job Title"}
      </p>
      <div
        className={cn(
          "flex text-[0.8em] pt-1",
          isStacked
            ? cn("flex-col gap-1", isLeft ? "items-start" : "items-center")
            : cn(
                "flex-wrap gap-x-5 gap-y-1",
                isLeft ? "justify-start" : "justify-center",
              ),
        )}
        style={{ color: textColor }}
      >
        {useContactSeparator
          ? withContactSeparators(contactItems(personal, contactTheme), theme)
          : contactItems(personal, theme)}
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
        style={{
          fontSize: customization.fullNameSize,
          color: customization.toggles.fullName ? theme.accentText : textColor,
        }}
      >
        {personal.fullName || "Your Name"}
      </h1>
      <p
        className="font-medium"
        style={{
          fontSize: customization.titleSize,
          color: customization.toggles.jobTitle ? theme.accentText : textColor,
        }}
      >
        {personal.jobTitle || "Job Title"}
      </p>
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
  sidebarSectionKeys,
  experience,
  noExperience,
  education,
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
  sidebarSectionKeys: SectionOrderKey[];
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  references: ReferenceItem[];
  includeReferences: boolean;
  showContent: boolean;
  paddingTopBottomPx: number;
  paddingLeftRightPx: number;
}) {
  return (
    <div
      className="h-full shrink-0 overflow-hidden"
      style={{ width: `${SIDEBAR_WIDTH_FRACTION * 100}%` }}
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
          {sidebarSectionKeys.map((key) => {
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
            if (key === "experience") {
              return (
                <SidebarExperienceBody
                  key="experience"
                  experience={experience}
                  noExperience={noExperience}
                  education={education}
                  theme={theme}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

/** simplified experience+education renderer for when "Experience" is
 *  dragged into the sidebar — unlike the main column, sidebar content isn't
 *  paginated (see the module comment above SidebarColumn), so entries are
 *  just stacked directly instead of built as measurable/splittable Blocks */
function SidebarExperienceBody({
  experience,
  noExperience,
  education,
  theme,
}: {
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  education: EducationItem[];
  theme: Theme;
}) {
  const showNoExperience = experience.length === 0;

  return (
    <>
      {(experience.length > 0 ||
        (showNoExperience && noExperience.length > 0)) && (
        <Section title="Experience" theme={theme}>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id}>
                <ExperienceHeader exp={exp} theme={theme} />
                {hasText(exp.description) && (
                  <div
                    className="rte-content text-[0.85em] leading-relaxed mt-1"
                    style={{ color: theme.bodyTextColor }}
                    dangerouslySetInnerHTML={{ __html: exp.description }}
                  />
                )}
              </div>
            ))}
            {showNoExperience &&
              noExperience.map((exp) => (
                <div key={exp.id}>
                  <NoExperienceHeader exp={exp} theme={theme} />
                  {hasText(exp.description) && (
                    <div
                      className="rte-content text-[0.85em] leading-relaxed mt-1"
                      style={{ color: theme.bodyTextColor }}
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))}
          </div>
        </Section>
      )}
      {education.length > 0 && (
        <Section title="Education" theme={theme}>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id}>
                <EducationEntry edu={edu} theme={theme} />
                {hasText(edu.description) && (
                  <div
                    className="rte-content text-[0.85em] leading-relaxed mt-1"
                    style={{ color: theme.bodyTextColor }}
                    dangerouslySetInnerHTML={{ __html: edu.description }}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
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
      <p
        className="text-[0.78em] whitespace-nowrap"
        style={{
          color: theme.datesAccentOn
            ? theme.bodyAccentColor
            : theme.bodyTextColor,
        }}
      >
        {fmtDate(exp.startDate)}
        {(exp.startDate || exp.endDate || exp.current) && " – "}
        {exp.current ? "Present" : fmtDate(exp.endDate)}
      </p>
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
                <>
                  <a
                    href={exp.url}
                    target="_blank"
                    rel="noreferrer"
                    className={
                      theme.linkStyle.includes("underline")
                        ? "underline"
                        : undefined
                    }
                    style={
                      theme.linkStyle.includes("color")
                        ? { color: theme.accentText }
                        : undefined
                    }
                  >
                    {exp.title}
                  </a>
                  {theme.linkStyle.includes("icon") && (
                    <LinkGlyph
                      size="0.85em"
                      strokeWidth={2}
                      className="ml-1 inline-block shrink-0 align-middle"
                    />
                  )}
                </>
              ) : (
                exp.title
              ))}
            {exp.title && exp.subtitle && ", "}
            {exp.subtitle}
          </span>
        )}
      </p>
      <p
        className="text-[0.78em] whitespace-nowrap"
        style={{
          color: theme.datesAccentOn
            ? theme.bodyAccentColor
            : theme.bodyTextColor,
        }}
      >
        {fmtDate(exp.startDate)}
        {(exp.startDate || exp.endDate || exp.current) && " – "}
        {exp.current ? "Present" : fmtDate(exp.endDate)}
      </p>
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
      <p
        className="text-[0.78em] whitespace-nowrap"
        style={{
          color: theme.datesAccentOn
            ? theme.bodyAccentColor
            : theme.bodyTextColor,
        }}
      >
        {fmtDate(edu.startDate)}
        {(edu.startDate || edu.endDate || edu.current) && " – "}
        {edu.current ? "Present" : fmtDate(edu.endDate)}
      </p>
    </div>
  );
}
const SECTION_ICONS: Record<string, LucideIcon> = {
  Summary: FileText,
  Experience: Briefcase,
  Education: GraduationCap,
  Skills: Sparkles,
  Languages: LanguagesIcon,
  References: Users,
};
function SectionHeadingIcon({
  icon: Icon,
  theme,
  onAccentBg,
}: {
  icon: LucideIcon;
  theme: Theme;
  onAccentBg: boolean;
}) {
  const isFilled = theme.sectionIcon === "filled";
  const badgeBg = onAccentBg ? "#fff" : theme.accent;
  const filledIconColor = onAccentBg ? theme.accent : "#fff";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: "1.5em",
        height: "1.5em",
        backgroundColor: isFilled ? badgeBg : undefined,
        border: isFilled ? undefined : `1.5px solid ${badgeBg}`,
      }}
    >
      <Icon
        size="0.85em"
        strokeWidth={2}
        color={isFilled ? filledIconColor : badgeBg}
      />
    </span>
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
  const isLongLine = theme.headingBorder === "line";
  const isLongUnderline = theme.headingBorder === "underline";
  const Icon = SECTION_ICONS[title];
  const showIcon = theme.sectionIcon !== "none" && !!Icon;
  const resolvedInk = theme.headingsAccentOn
    ? theme.accentText
    : theme.bodyTextColor;
  const resolvedFill = theme.headingsAccentOn
    ? theme.accent
    : theme.bodyTextColor;
  const iconTheme = { ...theme, accent: resolvedFill };
  const headingStyle: React.CSSProperties = {
    color: isFilled ? "#fff" : resolvedInk,
    fontSize: theme.headingSizePx,
    textTransform: theme.textTransform,
    backgroundColor: isFilled ? resolvedFill : undefined,
    borderColor: resolvedInk,
    borderWidth: isOutline
      ? 1
      : theme.showHeadingLine && !isFilled
        ? undefined
        : 0,
    borderStyle: isOutline ? "solid" : undefined,
    borderBottomWidth:
      !isOutline && !isFilled && !isLongLine && !isLongUnderline
        ? theme.showHeadingLine
          ? 1
          : 0
        : undefined,
    padding: isOutline || isFilled ? "3px 8px" : undefined,
    borderRadius: isFilled ? 4 : undefined,
  };

  return (
    <section>
      {isLongLine ? (
        <div className="mb-2 flex items-center gap-2">
          {showIcon && (
            <SectionHeadingIcon
              icon={Icon}
              theme={iconTheme}
              onAccentBg={false}
            />
          )}
          <h2
            className="shrink-0 font-bold tracking-[0.18em]"
            style={{
              color: resolvedInk,
              fontSize: theme.headingSizePx,
              textTransform: theme.textTransform,
            }}
          >
            {title}
          </h2>
          <span
            className="h-px flex-1"
            style={{ backgroundColor: resolvedInk }}
          />
        </div>
      ) : isLongUnderline ? (
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            {showIcon && (
              <SectionHeadingIcon
                icon={Icon}
                theme={iconTheme}
                onAccentBg={false}
              />
            )}
            <h2
              className="font-bold tracking-[0.18em]"
              style={{
                color: resolvedInk,
                fontSize: theme.headingSizePx,
                textTransform: theme.textTransform,
              }}
            >
              {title}
            </h2>
          </div>
          <div
            className="mt-1 h-px w-full"
            style={{ backgroundColor: resolvedInk }}
          />
        </div>
      ) : (
        <h2
          className="font-bold tracking-[0.18em] pb-1 mb-2 inline-flex items-center gap-1.5"
          style={headingStyle}
        >
          {showIcon && (
            <SectionHeadingIcon
              icon={Icon}
              theme={iconTheme}
              onAccentBg={isFilled}
            />
          )}
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
  const showLinkGlyph = theme.linkStyle.includes("icon") && !!entry.url;
  return (
    <IconText icon={icon} theme={theme}>
      {entry.url ? (
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className={
            theme.linkStyle.includes("underline") ? "underline" : undefined
          }
          style={
            theme.linkStyle.includes("color")
              ? { color: theme.accentText }
              : undefined
          }
        >
          {entry.title}
        </a>
      ) : (
        entry.title
      )}
      {showLinkGlyph && (
        <LinkGlyph
          size="0.85em"
          strokeWidth={2}
          className="ml-1 inline-block shrink-0 align-middle"
        />
      )}
    </IconText>
  );
}
function StyledIcon({ Icon, theme }: { Icon: LucideIcon; theme: Theme }) {
  if (theme.iconStyle === "faded") {
    return (
      <Icon size="1em" strokeWidth={1.8} className="shrink-0 opacity-50" />
    );
  }
  if (theme.iconStyle === "plain") {
    return <Icon size="1em" strokeWidth={1.8} className="shrink-0" />;
  }
  const isFilled = theme.iconStyle === "filled" || theme.iconStyle === "square";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        theme.iconStyle === "square" ? "rounded-sm" : "rounded-full",
        !isFilled && "border",
      )}
      style={{
        width: "1.75em",
        height: "1.75em",
        backgroundColor: isFilled ? theme.accent : undefined,
        borderColor: isFilled ? undefined : theme.accentText,
      }}
    >
      <Icon
        size="0.95em"
        strokeWidth={1.8}
        color={isFilled ? "#fff" : theme.accentText}
      />
    </span>
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
      {showIcon && <StyledIcon Icon={Icon} theme={theme} />}
      {children}
    </span>
  );
}
