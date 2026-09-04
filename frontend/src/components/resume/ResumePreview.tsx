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
import { extraExperienceTitle } from "../../lib/experienceDisplay";
import { orderedExperienceEntries } from "../../lib/experienceOrder";
import { withStableItemIds, listKey } from "../../lib/resumeIds";
import { resumeHeading, resumePresent, resumeDegreeJoin, resumeDegreeFallback, resumeSheetLang, resumeNameFallback, resumeTitleFallback } from "../../lib/resumeHeadings";
import { ResumeChromeProvider } from "./layouts/shared";
import { useResumeStore } from "../../store/resumeStore";
import {
  type Resume,
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
import { idealTextColor } from "../../lib/color";
import { photoImgStyle } from "../../lib/photoFit";
import { resumePhotoSrc } from "../../lib/personAvatar";
import { hrefFromUrl, linkDisplayLabel, looksLikeUrl } from "../../lib/contactLinks";
import { cssFontStack } from "../../lib/fonts";
import { marginPercentCss, PAGE_SIZE_MM } from "../../lib/pageSize";
import {
  orderedMainGroups,
  partitionSectionOrder,
} from "../../lib/sectionOrder";
import { cn } from "../../lib/utils";
import { hasSpecialLayout } from "./layouts";
import { SpecialPaginatedLayout } from "./layouts/SpecialPaginatedLayout";

function fmtDate(
  value: string,
  format: Customization["dateFormat"] = "monthYear",
  headingLanguage: "en" | "km" = "en",
) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  if (format === "yearOnly") return `${y}`;
  if (format === "numeric") return `${String(m).padStart(2, "0")}/${y}`;
  return new Date(y, m - 1).toLocaleDateString(
    headingLanguage === "km" ? "km-KH" : "en-US",
    {
      month: "short",
      year: "numeric",
    },
  );
}

function hasText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

interface RichTextFragment {
  html: string;
  tag: string;
}

function splitBrParagraph(el: Element): RichTextFragment[] | null {
  if (el.tagName !== "P" || !el.querySelector("br")) return null;
  const lines: RichTextFragment[] = [];
  let buf = "";
  const flush = () => {
    const text = buf.replace(/<br\s*\/?>/gi, "").trim();
    if (text) lines.push({ html: `<p>${text}</p>`, tag: "P" });
    buf = "";
  };
  Array.from(el.childNodes).forEach((child) => {
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      (child as Element).tagName === "BR"
    ) {
      flush();
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      buf += (child as Element).outerHTML;
    } else {
      buf += child.textContent || "";
    }
  });
  flush();
  return lines.length > 1 ? lines : null;
}

function splitRichText(html: string): RichTextFragment[] {
  const container = document.createElement("div");
  container.innerHTML = html;
  const fragments: RichTextFragment[] = [];

  const consume = (el: Element) => {
    if (
      (el.tagName === "DIV" || el.tagName === "SECTION") &&
      el.children.length > 0
    ) {
      Array.from(el.children).forEach(consume);
      return;
    }
    if (el.tagName === "UL" || el.tagName === "OL") {
      Array.from(el.children).forEach((li) => {
        const wrapper = document.createElement(el.tagName);
        wrapper.appendChild(li.cloneNode(true));
        fragments.push({ html: wrapper.outerHTML, tag: el.tagName });
      });
      return;
    }
    const brLines = splitBrParagraph(el);
    if (brLines) {
      fragments.push(...brLines);
      return;
    }
    fragments.push({ html: el.outerHTML, tag: el.tagName });
  };

  if (container.children.length === 0) {
    const lines = (container.textContent || "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      return lines.map((line) => ({ html: `<p>${line}</p>`, tag: "P" }));
    }
    return [{ html, tag: "" }];
  }

  Array.from(container.children).forEach(consume);
  return fragments.length > 0 ? fragments : [{ html, tag: "" }];
}

interface Block {
  key: string;
  gapBefore: number;
  node: React.ReactNode;
  /** Skills/languages share a two-column row and paginate independently. */
  lane?: "skills" | "languages";
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
  headingsLetterSpacing: number;
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
  showTimeline: boolean;
  skillsListMode: boolean;
  dateFormat: Customization["dateFormat"];
  headingLanguage: "en" | "km";
  /** className appended alongside "rte-content" to swap the bullet marker
   *  glyph on rendered lists; empty for the browser-default disc */
  bulletClass: string;
}

function useTheme(customization: Customization): Theme {
  return useMemo(() => {
    return {
      accent: customization.accentColor,
      accentText: customization.accentColor,
      fontSize: `${customization.fontSize}px`,
      fontFamily: cssFontStack(customization.fontFamily),
      lineHeight:
        customization.headingLanguage === "km"
          ? Math.max(customization.lineHeight, 1.6)
          : customization.lineHeight,
      gapSection: customization.elementSpacing * (20 / 12),
      gapExpItem: customization.elementSpacing,
      gapEduItem: customization.elementSpacing * (10 / 12),
      textTransform: customization.capitalization,
      headingBorder: customization.headingBorder,
      headingsLetterSpacing: customization.headingsLetterSpacing,
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
      showTimeline: customization.toggles.timeline,
      skillsListMode: customization.skillsDisplay === "list",
      dateFormat: customization.dateFormat,
      headingLanguage: customization.headingLanguage === "km" ? "km" : "en",
      bulletClass:
        customization.bulletStyle === "disc"
          ? ""
          : `bullet-${customization.bulletStyle}`,
    };
  }, [customization]);
}

export default function ResumePreview({
  resume: resumeProp,
  pageLabelClassName = "text-text-secondary",
  singlePage = false,
  lockNativeSize = false,
}: {
  resume?: Resume;
  pageLabelClassName?: string;
  /** Render only the first page, with no "Page X of Y" label - used for small thumbnails. */
  singlePage?: boolean;
  /** Keep the page at native A4/Letter px and let a parent scale it (ScaledResumePreview). */
  lockNativeSize?: boolean;
}) {
  const storeResume = useResumeStore((s) => s.resume);
  const resume = useMemo(
    () => withStableItemIds(resumeProp ?? storeResume),
    [resumeProp, storeResume],
  );
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
  const sidebarBgColor = customization.sidebarBgColor;
  const sidebarTextColor = sidebarBgColor
    ? idealTextColor(sidebarBgColor)
    : customization.bodyTextColor;
  const headerTextColor =
    headerInSidebar && sidebarBgColor
      ? sidebarTextColor
      : customization.bodyTextColor;
  const pageBackgroundColor = customization.bodyBgColor;
  // sections placed in the sidebar (Section/SkillsBody/etc. all key their
  // ink off `theme.bodyTextColor`) need to swap to a contrast-safe color
  // when the sidebar has its own fill, independently of the main column
  const sidebarTheme: Theme = sidebarBgColor
    ? { ...theme, bodyTextColor: sidebarTextColor }
    : theme;

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
            className={cn("rte-content text-[0.9em] leading-relaxed", theme.bulletClass)}
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
    const mixedExperience = orderedExperienceEntries({
      experience,
      noExperience,
      experienceOrder,
    });

    mixedExperience.forEach((entry, i) => {
      const keyPrefix =
        entry.kind === "job" ? `exp-${entry.item.id}` : `noexp-${entry.item.id}`;
      const header =
        entry.kind === "job" ? (
          <ExperienceHeader exp={entry.item} theme={theme} />
        ) : (
          <NoExperienceHeader exp={entry.item} theme={theme} />
        );
      expEduBlocks.push({
        key: `${keyPrefix}-header`,
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

      if (hasText(entry.item.description)) {
        const paraGap = parseFloat(fontSize) * 0.85 * 0.5;
        const fragments = splitRichText(entry.item.description);
        fragments.forEach(({ html, tag }, j) => {
          const adjacentParagraphs =
            j > 0 && tag === "P" && fragments[j - 1].tag === "P";
          expEduBlocks.push({
            key: `${keyPrefix}-desc-${j}`,
            gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
            node: (
              <div
                className={cn("rte-content text-[0.85em] leading-relaxed", theme.bulletClass)}
                style={{ color: theme.bodyTextColor }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ),
          });
        });
      }
    });

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
                className={cn("rte-content text-[0.85em] leading-relaxed", theme.bulletClass)}
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
      skills
        .filter((s) => s.name)
        .forEach((s, i) => {
          skillsLanguageBlocks.push({
            key: `skill-${s.id}`,
            gapBefore: i === 0 ? gapSection : 4,
            lane: "skills",
            node: <SkillLine skill={s} theme={theme} accent={accent} />,
          });
        });
      languages
        .filter((l) => l.name)
        .forEach((l, i) => {
          skillsLanguageBlocks.push({
            key: `lang-${l.id}`,
            gapBefore: i === 0 ? gapSection : 4,
            lane: "languages",
            node: <LanguageLine language={l} theme={theme} accent={accent} />,
          });
        });

      const referencesBlocks: Block[] = [];
      if (includeReferences && references.length > 0) {
        referencesBlocks.push({
          key: "references",
          gapBefore: gapSection,
          node: (
            <Section title="References" theme={theme}>
              <div className="grid grid-cols-2 gap-4">
                {references.map((r, i) => (
                  <ReferenceEntry key={listKey(r.id, i, "ref")} r={r} theme={theme} />
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
      // - whatever's in `sidebarSectionKeys` renders inside SidebarColumn
      const skillsBlocks: Block[] = [];
      skills
        .filter((s) => s.name)
        .forEach((s, i) => {
          const line = <SkillLine skill={s} theme={theme} accent={accent} />;
          skillsBlocks.push({
            key: `skill-${s.id}`,
            gapBefore: i === 0 ? gapSection : 4,
            node:
              i === 0 ? (
                <Section title="Skills" theme={theme}>
                  {line}
                </Section>
              ) : (
                line
              ),
          });
        });

      const languageBlocks: Block[] = [];
      languages
        .filter((l) => l.name)
        .forEach((l, i) => {
          const line = (
            <LanguageLine language={l} theme={theme} accent={accent} />
          );
          languageBlocks.push({
            key: `lang-${l.id}`,
            gapBefore: i === 0 ? gapSection : 4,
            node:
              i === 0 ? (
                <Section title="Languages" theme={theme}>
                  {line}
                </Section>
              ) : (
                line
              ),
          });
        });

      const referencesBlocks: Block[] = [];
      if (includeReferences && references.length > 0) {
        referencesBlocks.push({
          key: "references",
          gapBefore: gapSection,
          node: (
            <Section title="References" theme={theme}>
              <div className="grid grid-cols-2 gap-4">
                {references.map((r, i) => (
                  <ReferenceEntry key={listKey(r.id, i, "ref")} r={r} theme={theme} />
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
    experienceOrder,
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
    const pageHeightPx = realPageWidthPx * pageAspect;
    let contentHeightPx = pageHeightPx - verticalPaddingPx * 2;
    if (customization.footerBar) contentHeightPx -= pageHeightPx * 0.02;
    if (customization.topAccentBar) contentHeightPx -= pageHeightPx * 0.025;
    const firstPageContentHeightPx = topHeaderBanner
      ? contentHeightPx - bannerHeightPx
      : contentHeightPx;
    return packPreviewPages(
      blocks,
      heights,
      firstPageContentHeightPx,
      contentHeightPx,
    );
  }, [
    blocks,
    heights,
    realPageWidthPx,
    topHeaderBanner,
    bannerHeightPx,
    measuredWidth,
    pageAspect,
    paddingTopBottomPct,
    customization.footerBar,
    customization.topAccentBar,
  ]);
  const paddingTopBottomPx = realPageWidthPx * (paddingTopBottomPct / 100);
  const paddingLeftRightPx = realPageWidthPx * (paddingLeftRightPct / 100);
  const mainColumnWidthPx = sidebarColumnVisible
    ? realPageWidthPx * (1 - SIDEBAR_WIDTH_FRACTION)
    : realPageWidthPx;
  const pageHeightPx = realPageWidthPx * pageAspect;
  const scaleFactor = lockNativeSize
    ? 1
    : containerWidth > 0
      ? Math.min(1, containerWidth / realPageWidthPx)
      : 1;

  const useSpecial = hasSpecialLayout(customization.layoutVariant);

  if (useSpecial) {
    return (
      <ResumeChromeProvider value={customization}>
      <div
        ref={wrapperRef}
        className="w-full min-w-0 text-left"
        style={lockNativeSize ? { width: realPageWidthPx } : undefined}
      >
        <SpecialPaginatedLayout
          resume={resume}
          pageWidthPx={realPageWidthPx}
          pageHeightPx={pageHeightPx}
          scaleFactor={scaleFactor}
          singlePage={singlePage}
          pageLabelClassName={pageLabelClassName}
          pageFormat={customization.pageFormat}
          pageBorder={customization.pageBorder}
          pageBorderWidth={customization.pageBorderWidth}
          accent={accent}
        />
      </div>
      </ResumeChromeProvider>
    );
  }

  return (
    <ResumeChromeProvider value={customization}>
    <div
      ref={wrapperRef}
      className="w-full min-w-0 space-y-4 text-left"
      style={lockNativeSize ? { width: realPageWidthPx } : undefined}
    >
      <div
        ref={measureContainerRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          width: mainColumnWidthPx - paddingLeftRightPx * 2,
          fontSize,
          fontFamily: theme.fontFamily,
          lineHeight: theme.lineHeight,
        }}
      >
        {blocks.map((b, blockIdx) => (
          <div
            key={b.key || `measure-${blockIdx}`}
            style={b.lane ? { width: "50%" } : undefined}
          >
            {b.node}
          </div>
        ))}
      </div>

      {(singlePage ? pages.slice(0, 1) : pages).map((pageBlocks, pageIndex) => (
        <div key={pageIndex}>
          {!singlePage && pages.length > 1 && (
            <p className={cn("mb-1.5 text-center text-xs", pageLabelClassName)}>
              Page {pageIndex + 1} of {pages.length}
            </p>
          )}
          <div
            className="relative shadow-xl rounded-sm w-full border border-line"
            style={{
              maxWidth: realPageWidthPx,
              aspectRatio:
                customization.pageFormat === "letter" ? "8.5/11" : "210/297",
              outline: customization.pageBorder
                ? `${customization.pageBorderWidth}px solid ${accent}`
                : undefined,
              outlineOffset: customization.pageBorder
                ? -customization.pageBorderWidth
                : undefined,
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-sm">
              <div
                className="resume-sheet"
                lang={resumeSheetLang({ headingLanguage: theme.headingLanguage })}
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
                  {customization.topAccentBar && (
                    <div
                      className="h-[2.5%] w-[30%] shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                  )}
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
                        theme={sidebarTheme}
                        accent={accent}
                        textColor={headerTextColor}
                        bgColor={sidebarBgColor}
                        headerInSidebar={headerInSidebar}
                        sidebarSectionKeys={sidebarSectionKeys}
                        experience={experience}
                        noExperience={noExperience}
                        experienceOrder={experienceOrder}
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
                      {renderPreviewPageBlocks(pageBlocks, theme)}
                    </div>
                    {sidebarColumnVisible && sidebarSide === "right" && (
                      <SidebarColumn
                        personal={personal}
                        customization={customization}
                        theme={sidebarTheme}
                        accent={accent}
                        textColor={headerTextColor}
                        bgColor={sidebarBgColor}
                        headerInSidebar={headerInSidebar}
                        sidebarSectionKeys={sidebarSectionKeys}
                        experience={experience}
                        noExperience={noExperience}
                        experienceOrder={experienceOrder}
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
                  {customization.footerBar && (
                    <div
                      className="h-[2%] w-full shrink-0"
                      style={{
                        backgroundColor: customization.sidebarBgColor || "#1F2937",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
    </ResumeChromeProvider>
  );
}

const TWO_COL_HEADING_PX = 28;

function packPreviewPages(
  blocks: Block[],
  heights: Record<string, number>,
  firstLimit: number,
  nextLimit: number,
): Block[][] {
  const pages: Block[][] = [[]];
  let used = 0;
  const hOf = (b: Block) => heights[b.key] ?? 0;
  const limitOf = (index: number) => (index === 0 ? firstLimit : nextLimit);

  const startPage = () => {
    pages.push([]);
    used = 0;
  };

  const takeColumn = (items: Block[], space: number, emptyPage: boolean) => {
    const taken: Block[] = [];
    let colUsed = 0;
    for (const item of items) {
      const heading = taken.length === 0 ? TWO_COL_HEADING_PX : 0;
      const gap = taken.length === 0 ? 0 : item.gapBefore;
      const need = heading + gap + hOf(item);
      if (taken.length > 0 && colUsed + need > space) break;
      if (taken.length === 0 && need > space && !emptyPage) break;
      taken.push(item);
      colUsed += need;
    }
    return { taken, colUsed };
  };

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.lane) {
      const group: Block[] = [];
      while (i < blocks.length && blocks[i].lane) {
        group.push(blocks[i]);
        i++;
      }
      let queue = group;
      while (queue.length > 0) {
        const page = pages[pages.length - 1];
        const empty = page.length === 0;
        const limit = limitOf(pages.length - 1);
        const space = empty ? limit : limit - used;
        if (!empty && space < TWO_COL_HEADING_PX + 16) {
          startPage();
          continue;
        }
        const skillsQ = queue.filter((b) => b.lane === "skills");
        const langsQ = queue.filter((b) => b.lane === "languages");
        const left = takeColumn(skillsQ, space, empty);
        const right = takeColumn(langsQ, space, empty);
        if (left.taken.length === 0 && right.taken.length === 0) {
          if (empty) {
            page.push(queue[0]);
            used = hOf(queue[0]);
            queue = queue.slice(1);
          } else {
            startPage();
          }
          continue;
        }
        const taken = new Set([...left.taken, ...right.taken]);
        queue.forEach((item) => {
          if (taken.has(item)) page.push(item);
        });
        queue = queue.filter((item) => !taken.has(item));
        used +=
          Math.max(left.colUsed, right.colUsed) +
          (empty ? 0 : (skillsQ[0] || langsQ[0]).gapBefore);
        if (queue.length > 0) startPage();
      }
      continue;
    }

    const h = hOf(block);
    const page = pages[pages.length - 1];
    const first = page.length === 0;
    const needed = (first ? 0 : block.gapBefore) + h;
    const limit = limitOf(pages.length - 1);
    if (!first && used + needed > limit) {
      startPage();
      pages[pages.length - 1].push(block);
      used = h;
    } else {
      page.push(block);
      used += needed;
    }
    i += 1;
  }

  return pages;
}

function renderPreviewPageBlocks(pageBlocks: Block[], theme: Theme) {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < pageBlocks.length) {
    const block = pageBlocks[i];
    if (block.lane) {
      const skills: Block[] = [];
      const langs: Block[] = [];
      const groupGap = block.gapBefore;
      while (i < pageBlocks.length && pageBlocks[i].lane) {
        if (pageBlocks[i].lane === "skills") skills.push(pageBlocks[i]);
        else langs.push(pageBlocks[i]);
        i += 1;
      }
      nodes.push(
        <div
          key={`twocol-${i}-${skills[0]?.key || "s"}-${langs[0]?.key || "l"}`}
          className="grid grid-cols-2 gap-6"
          style={{ marginTop: nodes.length === 0 ? 0 : groupGap }}
        >
          <div className="min-w-0 space-y-1">
            {skills.length > 0 && (
              <Section title="Skills" theme={theme}>
                {skills.map((s, si) => (
                  <div key={s.key || `skill-block-${si}`}>{s.node}</div>
                ))}
              </Section>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            {langs.length > 0 && (
              <Section title="Languages" theme={theme}>
                {langs.map((s, li) => (
                  <div key={s.key || `lang-block-${li}`}>{s.node}</div>
                ))}
              </Section>
            )}
          </div>
        </div>,
      );
      continue;
    }
    nodes.push(
      <div
        key={block.key || `block-${i}`}
        style={{ marginTop: nodes.length === 0 ? 0 : block.gapBefore }}
      >
        {block.node}
      </div>,
    );
    i += 1;
  }
  return nodes;
}

function SkillLine({
  skill,
  theme,
  accent,
}: {
  skill: SkillItem;
  theme: Theme;
  accent: string;
}) {
  if (theme.skillsListMode) {
    return (
      <div
        className="flex items-center gap-1.5 text-[0.85em]"
        style={{ color: theme.bodyTextColor }}
      >
        <span
          className="size-1 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {skill.name}
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-2">
      <p
        className="min-w-0 flex-1 break-words text-[0.85em]"
        style={{ color: theme.bodyTextColor }}
      >
        {skill.name}
      </p>
      <DotRow level={skill.level} accent={accent} theme={theme} />
    </div>
  );
}

function LanguageLine({
  language,
  theme,
  accent,
}: {
  language: LanguageItem;
  theme: Theme;
  accent: string;
}) {
  if (theme.skillsListMode) {
    return (
      <div
        className="flex items-center gap-1.5 text-[0.85em]"
        style={{ color: theme.bodyTextColor }}
      >
        <span
          className="size-1 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {language.name}
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-2">
      <p
        className="min-w-0 flex-1 break-words text-[0.85em]"
        style={{ color: theme.bodyTextColor }}
      >
        {language.name}
      </p>
      <DotRow level={language.level} accent={accent} theme={theme} />
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
  if (theme.skillsListMode) {
    return (
      <ul className="space-y-1">
        {skills
          .filter((s) => s.name)
          .map((s, i) => (
            <li
              key={listKey(s.id, i, "skill")}
              className="flex items-center gap-1.5 text-[0.85em]"
              style={{ color: theme.bodyTextColor }}
            >
              <span
                className="size-1 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
              />
              {s.name}
            </li>
          ))}
      </ul>
    );
  }
  return (
    <div className="space-y-1">
      {skills
        .filter((s) => s.name)
        .map((s, i) => (
          <div key={listKey(s.id, i, "skill")} className="flex items-center justify-between gap-2">
            <p className="text-[0.85em]" style={{ color: theme.bodyTextColor }}>
              {s.name}
            </p>
            <DotRow level={s.level} accent={accent} theme={theme} />
          </div>
        ))}
    </div>
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
  if (theme.skillsListMode) {
    return (
      <ul className="space-y-1">
        {languages
          .filter((l) => l.name)
          .map((l, i) => (
            <li
              key={listKey(l.id, i, "lang")}
              className="flex items-center gap-1.5 text-[0.85em]"
              style={{ color: theme.bodyTextColor }}
            >
              <span
                className="size-1 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
              />
              {l.name}
            </li>
          ))}
      </ul>
    );
  }
  return (
    <div className="space-y-1">
      {languages
        .filter((l) => l.name)
        .map((l, i) => (
          <div key={listKey(l.id, i, "lang")} className="flex items-center justify-between gap-2">
            <p className="text-[0.85em]" style={{ color: theme.bodyTextColor }}>
              {l.name}
            </p>
            <DotRow level={l.level} accent={accent} theme={theme} />
          </div>
        ))}
    </div>
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

function DotRow({
  level,
  accent,
  theme,
}: {
  level: number;
  accent: string;
  theme: Theme;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="size-[0.5em] rounded-full"
          style={
            i < level
              ? { backgroundColor: accent }
              : { backgroundColor: theme.bodyTextColor, opacity: 0.2 }
          }
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
      <LinkText key={`portfolio-${entry.id}`} icon="briefcase" field="portfolio" entry={entry} theme={theme} />,
    ),
  );
  personal.website.forEach((entry) =>
    items.push(
      <LinkText key={`website-${entry.id}`} icon="globe" field="website" entry={entry} theme={theme} />,
    ),
  );
  personal.linkedin.forEach((entry) =>
    items.push(
      <LinkText key={`linkedin-${entry.id}`} icon="linkedin" field="linkedin" entry={entry} theme={theme} />,
    ),
  );
  personal.github.forEach((entry) =>
    items.push(
      <LinkText key={`github-${entry.id}`} icon="github" field="github" entry={entry} theme={theme} />,
    ),
  );
  personal.gitlab.forEach((entry) =>
    items.push(
      <LinkText key={`gitlab-${entry.id}`} icon="gitlab" field="gitlab" entry={entry} theme={theme} />,
    ),
  );
  personal.stackoverflow.forEach((entry) =>
    items.push(
      <LinkText
        key={`stackoverflow-${entry.id}`}
        icon="stackoverflow"
        field="stackoverflow"
        entry={entry}
        theme={theme}
      />,
    ),
  );
  personal.telegram.forEach((entry) =>
    items.push(
      <LinkText key={`telegram-${entry.id}`} icon="send" field="telegram" entry={entry} theme={theme} />,
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
  const showPhoto = customization.showPhoto;
  const isRow = customization.headerLayout === "row" && showPhoto;
  const isLeft = theme.headerAlignment === "left" || isRow;
  const isStacked = theme.contactArrangement === "stacked";
  const useContactSeparator = !isStacked && theme.contactSeparator !== "icon";
  const contactTheme = useContactSeparator
    ? { ...theme, showHeaderIcons: false, showLinkIcons: false }
    : theme;

  const photoNode = showPhoto && (
    <div
      className={cn("overflow-hidden shrink-0", !isRow && !isLeft && "mx-auto")}
      style={{
        width: customization.photoSize,
        height: customization.photoSize,
        borderRadius: photoRadiusFor(customization.photoShape),
        outline: customization.photoBorder
          ? `1.5px solid ${theme.accent}`
          : undefined,
        outlineOffset: customization.photoBorder ? -1.5 : undefined,
      }}
    >
      <img src={resumePhotoSrc(personal)} alt="" style={photoImgStyle(personal)} />
    </div>
  );

  const textNode = (
    <>
      <h1
        className="font-bold leading-tight"
        style={{
          fontSize: customization.fullNameSize,
          color: customization.toggles.fullName ? theme.accentText : textColor,
        }}
      >
        {personal.fullName || resumeNameFallback(customization)}
      </h1>
      <p
        className="font-medium"
        style={{
          fontSize: customization.titleSize,
          color: customization.toggles.jobTitle ? theme.accentText : textColor,
        }}
      >
        {personal.jobTitle || resumeTitleFallback(customization)}
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
    </>
  );

  if (isRow) {
    return (
      <header className="flex items-center gap-4">
        {photoNode}
        <div className="space-y-2 text-left min-w-0">{textNode}</div>
      </header>
    );
  }

  return (
    <header className={cn("space-y-2", isLeft ? "text-left" : "text-center")}>
      {photoNode}
      {textNode}
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
  const showPhoto =
    customization.showPhoto && !customization.sidebarPhotoFill;

  return (
    <header className="text-center space-y-2">
      {showPhoto && (
        <div
          className="overflow-hidden mx-auto"
          style={{
            width: customization.photoSize,
            height: customization.photoSize,
            borderRadius: photoRadiusFor(customization.photoShape),
            outline: customization.photoBorder
              ? `1.5px solid ${theme.accent}`
              : undefined,
            outlineOffset: customization.photoBorder ? -1.5 : undefined,
          }}
        >
          <img src={resumePhotoSrc(personal)} alt="" style={photoImgStyle(personal)} />
        </div>
      )}
      <h1
        className="font-bold leading-tight"
        style={{
          fontSize: customization.fullNameSize,
          color: customization.toggles.fullName ? theme.accentText : textColor,
        }}
      >
        {personal.fullName || resumeNameFallback(customization)}
      </h1>
      <p
        className="font-medium"
        style={{
          fontSize: customization.titleSize,
          color: customization.toggles.jobTitle ? theme.accentText : textColor,
        }}
      >
        {personal.jobTitle || resumeTitleFallback(customization)}
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
  bgColor,
  headerInSidebar,
  sidebarSectionKeys,
  experience,
  noExperience,
  experienceOrder,
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
  bgColor?: string;
  headerInSidebar: boolean;
  sidebarSectionKeys: SectionOrderKey[];
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  experienceOrder?: string[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  references: ReferenceItem[];
  includeReferences: boolean;
  showContent: boolean;
  paddingTopBottomPx: number;
  paddingLeftRightPx: number;
}) {
  const showFullBleedPhoto =
    headerInSidebar &&
    customization.sidebarPhotoFill &&
    customization.showPhoto;
  return (
    <div
      className="h-full shrink-0 overflow-hidden"
      style={{
        width: `${SIDEBAR_WIDTH_FRACTION * 100}%`,
        backgroundColor: bgColor || undefined,
      }}
    >
      {showContent && (
        <>
          {showFullBleedPhoto && (
            <img
              src={resumePhotoSrc(personal)}
              alt=""
              className="block w-full object-cover"
              style={{ aspectRatio: 0.92 }}
            />
          )}
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
                    {references.map((r, i) => (
                      <ReferenceEntry key={listKey(r.id, i, "ref")} r={r} theme={theme} />
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
                  experienceOrder={experienceOrder}
                  education={education}
                  theme={theme}
                />
              );
            }
            return null;
          })}
          </div>
        </>
      )}
    </div>
  );
}

/** simplified experience+education renderer for when "Experience" is
 *  dragged into the sidebar - unlike the main column, sidebar content isn't
 *  paginated (see the module comment above SidebarColumn), so entries are
 *  just stacked directly instead of built as measurable/splittable Blocks */
function SidebarExperienceBody({
  experience,
  noExperience,
  experienceOrder,
  education,
  theme,
}: {
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  experienceOrder?: string[];
  education: EducationItem[];
  theme: Theme;
}) {
  const mixedExperience = orderedExperienceEntries({
    experience,
    noExperience,
    experienceOrder,
  });

  return (
    <>
      {mixedExperience.length > 0 && (
        <Section title="Experience" theme={theme}>
          <div className="space-y-3">
            {mixedExperience.map((entry, i) => (
              <div key={listKey(entry.item.id, i, "exp")}>
                {entry.kind === "job" ? (
                  <ExperienceHeader exp={entry.item} theme={theme} />
                ) : (
                  <NoExperienceHeader exp={entry.item} theme={theme} />
                )}
                {hasText(entry.item.description) && (
                  <div
                    className={cn("rte-content text-[0.85em] leading-relaxed mt-1", theme.bulletClass)}
                    style={{ color: theme.bodyTextColor }}
                    dangerouslySetInnerHTML={{ __html: entry.item.description }}
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
            {education.map((edu, i) => (
              <div key={listKey(edu.id, i, "edu")}>
                <EducationEntry edu={edu} theme={theme} />
                {hasText(edu.description) && (
                  <div
                    className={cn("rte-content text-[0.85em] leading-relaxed mt-1", theme.bulletClass)}
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

/** self-contained per-entry dot + short line - deliberately NOT a
 *  continuous line across entries, since entries can land on different
 *  pages when the main column paginates */
function TimelineMarker({ theme }: { theme: Theme }) {
  return (
    <>
      <span
        className="absolute left-0 top-[0.35em] size-1.5 rounded-full"
        style={{ backgroundColor: theme.bodyAccentColor }}
      />
      <span
        className="absolute left-0.5 top-[0.9em] w-px h-[1.6em]"
        style={{ backgroundColor: theme.bodyAccentColor, opacity: 0.35 }}
      />
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
    <div
      className={cn(
        "flex justify-between gap-3 items-baseline",
        theme.showTimeline && "relative pl-3",
      )}
    >
      {theme.showTimeline && <TimelineMarker theme={theme} />}
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
        {fmtDate(exp.startDate, theme.dateFormat, theme.headingLanguage)}
        {(exp.startDate || exp.endDate || exp.current) && " – "}
        {exp.current
          ? resumePresent({ headingLanguage: theme.headingLanguage })
          : fmtDate(exp.endDate, theme.dateFormat, theme.headingLanguage)}
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
    <div
      className={cn(
        "flex justify-between gap-3 items-baseline",
        theme.showTimeline && "relative pl-3",
      )}
    >
      {theme.showTimeline && <TimelineMarker theme={theme} />}
      <p
        className="font-semibold text-[0.95em]"
        style={{ color: theme.bodyTextColor }}
      >
        {hasUrl ? (
          <a
            href={exp.url}
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
            {extraExperienceTitle(exp, {
              headingLanguage: theme.headingLanguage,
            })}
          </a>
        ) : (
          extraExperienceTitle(exp, {
            headingLanguage: theme.headingLanguage,
          })
        )}
        {hasUrl && theme.linkStyle.includes("icon") && (
          <LinkGlyph
            size="0.85em"
            strokeWidth={2}
            className="ml-1 inline-block shrink-0 align-middle"
          />
        )}
        {exp.subtitle && (
          <span
            className="font-normal"
            style={{ color: theme.bodyAccentColor }}
          >
            {" "}
            - {exp.subtitle}
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
        {fmtDate(exp.startDate, theme.dateFormat, theme.headingLanguage)}
        {(exp.startDate || exp.endDate || exp.current) && " – "}
        {exp.current
          ? resumePresent({ headingLanguage: theme.headingLanguage })
          : fmtDate(exp.endDate, theme.dateFormat, theme.headingLanguage)}
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
          {[edu.degree, edu.field].filter(Boolean).join(resumeDegreeJoin({ headingLanguage: theme.headingLanguage })) ||
            resumeDegreeFallback({ headingLanguage: theme.headingLanguage })}
        </p>
        <p className="text-[0.85em]" style={{ color: theme.bodyAccentColor }}>
          {[edu.school, edu.gpa && `${theme.headingLanguage === "km" ? "មធ្យមភាគ" : "GPA"}: ${edu.gpa}`]
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
        {fmtDate(edu.startDate, theme.dateFormat, theme.headingLanguage)}
        {(edu.startDate || edu.endDate || edu.current) && " – "}
        {edu.current
          ? resumePresent({ headingLanguage: theme.headingLanguage })
          : fmtDate(edu.endDate, theme.dateFormat, theme.headingLanguage)}
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
  const isKm = theme.headingLanguage === "km";
  const label = resumeHeading(title, {
    headingLanguage: theme.headingLanguage,
  });
  const resolvedInk = theme.headingsAccentOn
    ? theme.accentText
    : theme.bodyTextColor;
  const resolvedFill = theme.headingsAccentOn
    ? theme.accent
    : theme.bodyTextColor;
  const iconTheme = { ...theme, accent: resolvedFill };
  const textTransform = isKm ? "none" : theme.textTransform;
  const letterSpacing = isKm
    ? "0px"
    : theme.headingsLetterSpacing
      ? `calc(0.18em + ${theme.headingsLetterSpacing}px)`
      : undefined;
  const headingClass = cn(
    "font-bold",
    !isKm && "tracking-[0.18em]",
  );
  const headingStyle: React.CSSProperties = {
    color: isFilled ? "#fff" : resolvedInk,
    fontSize: theme.headingSizePx,
    textTransform,
    letterSpacing,
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
            className={cn("shrink-0", headingClass)}
            style={{
              color: resolvedInk,
              fontSize: theme.headingSizePx,
              textTransform,
              letterSpacing,
            }}
          >
            {label}
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
              className={headingClass}
              style={{
                color: resolvedInk,
                fontSize: theme.headingSizePx,
                textTransform,
                letterSpacing,
              }}
            >
              {label}
            </h2>
          </div>
          <div
            className="mt-1 h-px w-full"
            style={{ backgroundColor: resolvedInk }}
          />
        </div>
      ) : (
        <h2
          className={cn(headingClass, "pb-1 mb-2 inline-flex items-center gap-1.5")}
          style={headingStyle}
        >
          {showIcon && (
            <SectionHeadingIcon
              icon={Icon}
              theme={iconTheme}
              onAccentBg={isFilled}
            />
          )}
          {label}
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
  field,
  theme,
}: {
  icon: keyof typeof icons;
  field: string;
  entry: LinkItem;
  theme: Theme;
}) {
  const url = (entry.url || "").trim();
  const title = (entry.title || "").trim();
  if (!url && !title) return null;
  const label = linkDisplayLabel(entry, field);
  const href = url
    ? hrefFromUrl(url)
    : looksLikeUrl(title)
      ? hrefFromUrl(title)
      : "";
  const showLinkGlyph = theme.linkStyle.includes("icon") && !!href;
  return (
    <IconText icon={icon} theme={theme}>
      {href ? (
        <a
          href={href}
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
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>
      ) : (
        label
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
