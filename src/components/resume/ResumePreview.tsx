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
  type ExperienceItem,
  type NoExperienceItem,
  type EducationItem,
  type LinkItem,
  type PersonalInfo,
} from "../../types/resume";
import { photoImgStyle } from "../../lib/photoFit";
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

/** Tiptap's "empty" output is still a non-empty string like "<p></p>" */
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
    if ((el.tagName === "UL" || el.tagName === "OL") && el.children.length > 1) {
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


const PAGE_ASPECT = 297 / 210;
const PAGE_PADDING_PCT = 0.07;
const GAP_SECTION = 20;
const GAP_EXP_ITEM = 12;
const GAP_EDU_ITEM = 10;

interface Block {
  key: string;
  gapBefore: number;
  node: React.ReactNode;
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
  const accent = customization.accentColor;
  const fontSize = fontSizes[customization.fontSize];

  const blocks = useMemo<Block[]>(() => {
    const list: Block[] = [
      { key: "header", gapBefore: 0, node: <HeaderBlock personal={personal} accent={accent} /> },
    ];

    if (hasText(personal.summary)) {
      const paraGap = parseFloat(fontSize) * 0.9 * 0.5;
      const fragments = splitRichText(personal.summary);
      fragments.forEach(({ html, tag }, i) => {
        const node = (
          <div
            className="rte-content text-[0.9em] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        const adjacentParagraphs = i > 0 && tag === "P" && fragments[i - 1].tag === "P";
        list.push({
          key: `summary-${i}`,
          gapBefore: i === 0 ? GAP_SECTION : adjacentParagraphs ? paraGap : 0,
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
      const header = <ExperienceHeader exp={exp} />;
      list.push({
        key: `exp-${exp.id}-header`,
        gapBefore: i === 0 ? GAP_SECTION : GAP_EXP_ITEM,
        node:
          i === 0 ? (
            <Section title="Experience" accent={accent}>
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
          const adjacentParagraphs = j > 0 && tag === "P" && fragments[j - 1].tag === "P";
          list.push({
            key: `exp-${exp.id}-desc-${j}`,
            gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
            node: (
              <div
                className="rte-content text-[0.85em] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ),
          });
        });
      }
    });

    if (experience.length === 0) {
      noExperience.forEach((exp, i) => {
        const header = <NoExperienceHeader exp={exp} />;
        list.push({
          key: `noexp-${exp.id}-header`,
          gapBefore: i === 0 ? GAP_SECTION : GAP_EXP_ITEM,
          node:
            i === 0 ? (
              <Section title="Experience" accent={accent}>
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
            list.push({
              key: `noexp-${exp.id}-desc-${j}`,
              gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
              node: (
                <div
                  className="rte-content text-[0.85em] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ),
            });
          });
        }
      });
    }

    education.forEach((edu, i) => {
      const header = <EducationEntry edu={edu} />;
      list.push({
        key: `edu-${edu.id}-header`,
        gapBefore: i === 0 ? GAP_SECTION : GAP_EDU_ITEM,
        node:
          i === 0 ? (
            <Section title="Education" accent={accent}>
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
          const adjacentParagraphs = j > 0 && tag === "P" && fragments[j - 1].tag === "P";
          list.push({
            key: `edu-${edu.id}-desc-${j}`,
            gapBefore: j === 0 ? 4 : adjacentParagraphs ? paraGap : 0,
            node: (
              <div
                className="rte-content text-[0.85em] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ),
          });
        });
      }
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
                  {skills
                    .map((s) =>
                      s.name
                        ? `${s.name} (${SKILL_LEVEL_LABELS[s.level - 1]})`
                        : "",
                    )
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </Section>
            )}
            {languages.length > 0 && (
              <Section title="Languages" accent={accent}>
                <p className="text-[0.85em] leading-relaxed">
                  {languages
                    .map((l) =>
                      l.name
                        ? `${l.name} (${LANGUAGE_LEVEL_LABELS[l.level - 1]})`
                        : "",
                    )
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </Section>
            )}
          </div>
        ),
      });
    }

    if (includeReferences && references.length > 0) {
      list.push({
        key: "references",
        gapBefore: GAP_SECTION,
        node: (
          <Section title="References" accent={accent}>
            <div className="grid grid-cols-2 gap-4">
              {references.map((r) => (
                <div key={r.id} className="text-[0.85em] leading-relaxed">
                  <p className="font-semibold">{r.name || "Reference name"}</p>
                  <p className="text-neutral-600">
                    {[r.jobTitle, r.company].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-neutral-500 text-[0.9em]">
                    {[r.email, r.phone].filter(Boolean).join(" - ")}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        ),
      });
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
    accent,
    fontSize,
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

function ExperienceHeader({ exp }: { exp: ExperienceItem }) {
  return (
    <div className="flex justify-between gap-3 items-baseline">
      <p className="font-semibold text-[0.95em]">
        {exp.jobTitle || "Job title"}
        {(exp.company || exp.location) && (
          <span className="font-normal text-neutral-600">
            {" "}
            - {[exp.company, exp.location].filter(Boolean).join(", ")}
          </span>
        )}
      </p>
      <p className="text-[0.78em] text-neutral-500 whitespace-nowrap">
        {fmtDate(exp.startDate)}
        {(exp.startDate || exp.endDate || exp.current) && " – "}
        {exp.current ? "Present" : fmtDate(exp.endDate)}
      </p>
    </div>
  );
}

function NoExperienceHeader({ exp }: { exp: NoExperienceItem }) {
  const hasUrl = exp.url.trim() !== "";
  return (
    <div className="flex justify-between gap-3 items-baseline">
      <p className="font-semibold text-[0.95em]">
        {NO_EXPERIENCE_TYPE_LABELS[exp.type]}
        {(exp.title || exp.subtitle) && (
          <span className="font-normal text-neutral-600">
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
      <p className="text-[0.78em] text-neutral-500 whitespace-nowrap">
        {fmtDate(exp.startDate)}
        {(exp.startDate || exp.endDate || exp.current) && " – "}
        {exp.current ? "Present" : fmtDate(exp.endDate)}
      </p>
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
        <p className="text-[0.85em] text-neutral-600">
          {[edu.school, edu.gpa && `GPA: ${edu.gpa}`].filter(Boolean).join(" · ")}
        </p>
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
