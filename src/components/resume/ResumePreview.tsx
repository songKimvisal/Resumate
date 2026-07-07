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
import type { ExperienceItem, EducationItem, LinkItem, PersonalInfo } from "../../types/resume";
import { photoImgStyle } from "../../lib/photoFit";
import { cn } from "../../lib/utils";

/** Formats "2023-06" → "Jun 2023" */
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

/** Tiptap's "empty" output is still a non-empty string like "<p></p>" */
function hasText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

/** Splits rich-text HTML into its top-level nodes (each <p>, <ul>, ...) so a
 *  long summary can page-break between paragraphs instead of being treated
 *  as one unsplittable block (which left the previous page mostly empty). */
function splitRichText(html: string): string[] {
  const container = document.createElement("div");
  container.innerHTML = html;
  const fragments = Array.from(container.children).map((el) => el.outerHTML);
  return fragments.length > 0 ? fragments : [html];
}

// A4 page proportions + the padding baked into each page's white area.
const PAGE_ASPECT = 297 / 210;
const PAGE_PADDING_PCT = 0.07;
// px gaps this template used between sections vs. between items within a
// section (matching the old flex `gap-5` / `space-y-3` / `space-y-2.5`).
// These are rem-based, so — like the rest of Tailwind's spacing scale —
// they're fixed regardless of the page's own font-size setting.
const GAP_SECTION = 20;
const GAP_EXP_ITEM = 12;
const GAP_EDU_ITEM = 10;

interface Block {
  key: string;
  /** gap to render above this block, ignored when it's first on a page */
  gapBefore: number;
  node: React.ReactNode;
}

/** A4-proportioned live preview ("classic" template). Splits content across
 *  as many pages as it needs — measures each section/entry's rendered
 *  height off-screen, then greedily packs them onto pages so a page break
 *  never lands in the middle of an entry.
 *  Resume content is always English — this component is intentionally
 *  not translated. */
export default function ResumePreview({
  pageLabelClassName = "text-text-secondary",
}: {
  /** Classes for the "Page X of Y" label — the label sits on whatever
   *  background surrounds the page (the app's own themed background in the
   *  sidebar, a dark overlay in the fullscreen modal), so callers on a dark
   *  background should override this to something light. */
  pageLabelClassName?: string;
}) {
  const resume = useResumeStore((s) => s.resume);
  const { personal, experience, education, skills, languages, customization } =
    resume;
  const accent = customization.accentColor;
  const fontSize = fontSizes[customization.fontSize];

  const blocks = useMemo<Block[]>(() => {
    const list: Block[] = [
      { key: "header", gapBefore: 0, node: <HeaderBlock personal={personal} accent={accent} /> },
    ];

    if (hasText(personal.summary)) {
      // matches .rte-content's `p + p { margin-top: 0.5em }`, scaled to
      // this text's actual em size (0.9em of the page's own font-size)
      const paraGap = parseFloat(fontSize) * 0.9 * 0.5;
      splitRichText(personal.summary).forEach((html, i) => {
        const node = (
          <div
            className="rte-content text-[0.9em] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        list.push({
          key: `summary-${i}`,
          gapBefore: i === 0 ? GAP_SECTION : paraGap,
          node:
            i === 0 ? (
              <Section title="Summary" accent={accent}>
                {node}
              </Section>
            ) : (
              node
            ),
        });
      });
    }

    experience.forEach((exp, i) => {
      const entry = <ExperienceEntry exp={exp} />;
      list.push({
        key: `exp-${exp.id}`,
        gapBefore: i === 0 ? GAP_SECTION : GAP_EXP_ITEM,
        node:
          i === 0 ? (
            <Section title="Experience" accent={accent}>
              {entry}
            </Section>
          ) : (
            entry
          ),
      });
    });

    education.forEach((edu, i) => {
      const entry = <EducationEntry edu={edu} />;
      list.push({
        key: `edu-${edu.id}`,
        gapBefore: i === 0 ? GAP_SECTION : GAP_EDU_ITEM,
        node:
          i === 0 ? (
            <Section title="Education" accent={accent}>
              {entry}
            </Section>
          ) : (
            entry
          ),
      });
    });

    if (skills.length > 0 || languages.length > 0) {
      list.push({
        key: "skills-languages",
        gapBefore: GAP_SECTION,
        node: (
          <div className="grid grid-cols-2 gap-6">
            {skills.length > 0 && (
              <Section title="Skills" accent={accent}>
                <p className="text-[0.85em] leading-relaxed">
                  {skills.map((s) => s.name).filter(Boolean).join(" · ")}
                </p>
              </Section>
            )}
            {languages.length > 0 && (
              <Section title="Languages" accent={accent}>
                <p className="text-[0.85em] leading-relaxed">
                  {languages
                    .map((l) => (l.name ? `${l.name} (${l.level})` : ""))
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Section>
            )}
          </div>
        ),
      });
    }

    return list;
  }, [personal, experience, education, skills, languages, accent, fontSize]);

  // ---------- measure each block's rendered height, then paginate ----------
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  // the pageWidth `heights` was actually measured at — until this matches
  // pageWidth, heights are stale (e.g. measured before layout settled) and
  // must not be used to compute a page split.
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

  const pages = useMemo(() => {
    if (pageWidth === 0 || measuredWidth !== pageWidth) return [blocks];
    const paddingPx = pageWidth * PAGE_PADDING_PCT;
    const contentHeightPx = pageWidth * PAGE_ASPECT - paddingPx * 2;

    const result: Block[][] = [[]];
    let used = 0;
    for (const b of blocks) {
      const h = heights[b.key] ?? 0;
      const currentPage = result[result.length - 1];
      const isFirstOnPage = currentPage.length === 0;
      const needed = (isFirstOnPage ? 0 : b.gapBefore) + h;
      if (!isFirstOnPage && used + needed > contentHeightPx) {
        result.push([b]);
        used = h;
      } else {
        currentPage.push(b);
        used += needed;
      }
    }
    return result;
  }, [blocks, heights, pageWidth, measuredWidth]);

  return (
    <div ref={wrapperRef} className="space-y-4">
      {/* off-screen measuring pass: same width/font-size as a real page, so
          the heights used for pagination match what actually renders */}
      <div
        ref={measureContainerRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: -99999,
          visibility: "hidden",
          pointerEvents: "none",
          width: pageWidth ? pageWidth * (1 - PAGE_PADDING_PCT * 2) : undefined,
          fontSize,
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
            className="bg-white text-neutral-800 shadow-xl rounded-sm w-full aspect-210/297 overflow-hidden"
            style={{ fontSize }}
          >
            <div className="h-full p-[7%] overflow-hidden">
              {pageBlocks.map((b, i) => (
                <div
                  key={b.key}
                  style={{ marginTop: i === 0 ? 0 : b.gapBefore }}
                >
                  {b.node}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Centered name/title/contact-icons header — always the first block. */
function HeaderBlock({
  personal,
  accent,
}: {
  personal: PersonalInfo;
  accent: string;
}) {
  return (
    <header className="text-center space-y-2">
      {personal.photoUrl && (
        <div className="size-20 rounded-full overflow-hidden mx-auto">
          <img src={personal.photoUrl} alt="" style={photoImgStyle(personal)} />
        </div>
      )}
      <h1 className="text-[1.9em] font-bold leading-tight">
        {personal.fullName || "Your Name"}
      </h1>
      <p className="text-[1.15em] font-medium" style={{ color: accent }}>
        {personal.jobTitle || "Job Title"}
      </p>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.8em] text-neutral-600 pt-1">
        {personal.phone && <IconText icon="phone">{personal.phone}</IconText>}
        {personal.email && <IconText icon="mail">{personal.email}</IconText>}
        {personal.location && (
          <IconText icon="pin">{personal.location}</IconText>
        )}
        {personal.nationality && (
          <IconText icon="flag">{personal.nationality}</IconText>
        )}
        {personal.portfolio.map((entry) => (
          <LinkText key={entry.id} icon="briefcase" entry={entry} />
        ))}
        {personal.website.map((entry) => (
          <LinkText key={entry.id} icon="globe" entry={entry} />
        ))}
        {personal.linkedin.map((entry) => (
          <LinkText key={entry.id} icon="linkedin" entry={entry} />
        ))}
        {personal.github.map((entry) => (
          <LinkText key={entry.id} icon="github" entry={entry} />
        ))}
        {personal.gitlab.map((entry) => (
          <LinkText key={entry.id} icon="gitlab" entry={entry} />
        ))}
        {personal.stackoverflow.map((entry) => (
          <LinkText key={entry.id} icon="stackoverflow" entry={entry} />
        ))}
        {personal.telegram.map((entry) => (
          <LinkText key={entry.id} icon="send" entry={entry} />
        ))}
        {personal.passportId && (
          <IconText icon="id">{personal.passportId}</IconText>
        )}
      </div>
    </header>
  );
}

function ExperienceEntry({ exp }: { exp: ExperienceItem }) {
  return (
    <div>
      <div className="flex justify-between gap-3 items-baseline">
        <p className="font-semibold text-[0.95em]">
          {exp.jobTitle || "Job title"}
          {(exp.company || exp.location) && (
            <span className="font-normal text-neutral-600">
              {" "}
              — {[exp.company, exp.location].filter(Boolean).join(", ")}
            </span>
          )}
        </p>
        <p className="text-[0.78em] text-neutral-500 whitespace-nowrap">
          {fmtDate(exp.startDate)}
          {(exp.startDate || exp.endDate || exp.current) && " – "}
          {exp.current ? "Present" : fmtDate(exp.endDate)}
        </p>
      </div>
      {hasText(exp.description) && (
        <div
          className="rte-content mt-1 text-[0.85em] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: exp.description }}
        />
      )}
    </div>
  );
}

function EducationEntry({ edu }: { edu: EducationItem }) {
  return (
    <div className="flex justify-between gap-3">
      <div>
        <p className="font-semibold text-[0.95em]">
          {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
        </p>
        <p className="text-[0.85em] text-neutral-600">{edu.school}</p>
      </div>
      <p className="text-[0.78em] text-neutral-500 whitespace-nowrap">
        {fmtDate(edu.startDate)}
        {(edu.startDate || edu.endDate || edu.current) && " – "}
        {edu.current ? "Present" : fmtDate(edu.endDate)}
      </p>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="text-[0.8em] font-bold tracking-[0.18em] uppercase pb-1 mb-2 border-b"
        style={{ color: accent, borderColor: accent }}
      >
        {title}
      </h2>
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

/** Renders a repeatable link entry — only the title is shown, the URL is
 *  used as the href (or omitted entirely if the entry has no title). */
function LinkText({
  icon,
  entry,
}: {
  icon: keyof typeof icons;
  entry: LinkItem;
}) {
  if (!entry.title.trim()) return null;
  return (
    <IconText icon={icon}>
      {entry.url ? (
        <a href={entry.url} target="_blank" rel="noreferrer" className="hover:underline">
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
}: {
  icon: keyof typeof icons;
  children: React.ReactNode;
}) {
  const Icon = icons[icon];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size="1em" strokeWidth={1.8} className="shrink-0" />
      {children}
    </span>
  );
}
