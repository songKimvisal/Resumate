import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  EducationItem,
  ExperienceItem,
  NoExperienceItem,
  Resume,
} from "../../../types/resume";
import { cn } from "../../../lib/utils";
import { cssFontStack } from "../../../lib/fonts";
import { hasText, normalizeJobs, personalContactLines, ContactLink, gpaText } from "./shared";
import { resumeSheetLang } from "../../../lib/resumeHeadings";
import { SpecialLayout } from "./index";

type JobSlice = {
  id: string;
  description: string;
  showMeta: boolean;
};

type EduSlice = {
  id: string;
  description: string;
  showMeta: boolean;
};

type PagePlan = {
  summaryHtml: string;
  education: EduSlice[];
  jobs: JobSlice[];
  showSkills: boolean;
  showLanguages: boolean;
  showReferences: boolean;
  showContact: boolean;
};

type ContentUnit = {
  key: string;
  kind: "summary" | "education" | "job" | "references" | "contact";
  id?: string;
  description?: string;
  showMeta?: boolean;
};

/** Flatten rich HTML into discrete block chunks (no overlapping wrappers). */
function splitRichHtml(html: string): string[] {
  if (!html || !hasText(html)) return [];
  const container = document.createElement("div");
  container.innerHTML = html;

  const blockTags = new Set([
    "P",
    "UL",
    "OL",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "BLOCKQUOTE",
    "PRE",
    "TABLE",
    "HR",
    "DIV",
  ]);

  const flatten = (el: Element): string[] => {
    const children = Array.from(el.children);
    if (children.length === 0) {
      return hasText(el.innerHTML) ? [el.outerHTML] : [];
    }

    // Unwrap single nesting wrappers so we paginate real paragraphs.
    if (
      (el.tagName === "DIV" || el.tagName === "SECTION") &&
      children.every((c) => blockTags.has(c.tagName))
    ) {
      return children.flatMap((c) => flatten(c));
    }

    if (el.tagName === "UL" || el.tagName === "OL") {
      return Array.from(el.children).map((li) => {
        const wrapper = document.createElement(el.tagName);
        wrapper.appendChild(li.cloneNode(true));
        return wrapper.outerHTML;
      });
    }

    // A single <p> with <br> lines should paginate like separate bullets.
    if (el.tagName === "P" && el.querySelector("br")) {
      const lines: string[] = [];
      let buf = "";
      const flush = () => {
        const text = buf.replace(/<br\s*\/?>/gi, "").trim();
        if (text) lines.push(`<p>${text}</p>`);
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
      if (lines.length > 1) return lines;
    }

    return [el.outerHTML];
  };

  const parts: string[] = [];
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      parts.push(...flatten(node as Element));
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) parts.push(`<p>${text}</p>`);
    }
  });

  // dedupe consecutive identical chunks
  const deduped: string[] = [];
  for (const part of parts) {
    if (deduped[deduped.length - 1] !== part) deduped.push(part);
  }
  return deduped.length > 0 ? deduped : [html];
}

function pushSlicedUnits(
  units: ContentUnit[],
  kind: "summary" | "education" | "job",
  id: string | undefined,
  html: string,
) {
  const prefix = kind === "job" ? `job-${id}` : kind === "education" ? `edu-${id}` : "summary";
  const parts = hasText(html) ? splitRichHtml(html) : [""];
  if (parts.length <= 1) {
    units.push({
      key: prefix,
      kind,
      id,
      description: parts[0] || html || "",
      showMeta: true,
    });
    return;
  }
  parts.forEach((part, i) => {
    units.push({
      key: `${prefix}-p${i}`,
      kind,
      id,
      description: part,
      showMeta: i === 0,
    });
  });
}

function buildUnits(resume: Resume): ContentUnit[] {
  const units: ContentUnit[] = [];
  if (hasText(resume.personal.summary)) {
    pushSlicedUnits(units, "summary", undefined, resume.personal.summary);
  }
  resume.education.forEach((edu) => {
    pushSlicedUnits(units, "education", edu.id, edu.description);
  });

  const jobs = normalizeJobs(resume.experience, resume.noExperience, resume.experienceOrder, resume.customization);
  jobs.forEach((job) => {
    pushSlicedUnits(units, "job", job.id, job.description);
  });

  if (resume.includeReferences && resume.references.length > 0) {
    units.push({ key: "references", kind: "references" });
  }
  if (personalContactLines(resume.personal).length > 0) {
    units.push({ key: "contact", kind: "contact" });
  }
  return units;
}

function packUnits(
  units: ContentUnit[],
  heights: Record<string, number>,
  pageHeightPx: number,
): PagePlan[] {
  // 0.42 left page 1 half-empty since the sidebar leaves most height usable
  const firstBudget = pageHeightPx * 0.86;
  const nextBudget = pageHeightPx * 0.92;
  const gap = 8;

  if (units.length === 0) {
    return [
      {
        summaryHtml: "",
        education: [],
        jobs: [],
        showSkills: true,
        showLanguages: true,
        showReferences: false,
        showContact: false,
      },
    ];
  }

  const pages: ContentUnit[][] = [[]];
  let used = 0;

  // discount for the probe column wrapping more than the real layout
  const unitHeight = (unit: ContentUnit) =>
    Math.max(18, Math.ceil((heights[unit.key] ?? 36) * 0.92));

  for (const unit of units) {
    const h = unitHeight(unit);
    const page = pages[pages.length - 1];
    const isFirst = page.length === 0;
    const needed = (isFirst ? 0 : gap) + h;
    const limit = pages.length === 1 ? firstBudget : nextBudget;

    if (!isFirst && used + needed > limit) {
      pages.push([unit]);
      used = h;
    } else {
      page.push(unit);
      used += needed;
    }
  }

  // Pull content back onto earlier pages while space remains.
  for (let i = 0; i < pages.length - 1; i++) {
    const limit = i === 0 ? firstBudget : nextBudget;
    let usedNow = pages[i].reduce(
      (sum, u, idx) => sum + (idx === 0 ? 0 : gap) + unitHeight(u),
      0,
    );
    while (pages[i + 1] && pages[i + 1].length > 0) {
      const nextUnit = pages[i + 1][0];
      const needed = (pages[i].length === 0 ? 0 : gap) + unitHeight(nextUnit);
      if (usedNow + needed > limit) break;
      pages[i].push(pages[i + 1].shift()!);
      usedNow += needed;
      if (pages[i + 1].length === 0) pages.splice(i + 1, 1);
    }
  }

  return pages.map((pageUnits, pageIndex) => {
    const jobs: JobSlice[] = [];
    const education: EduSlice[] = [];
    const summaryParts: string[] = [];
    for (const u of pageUnits) {
      if (u.kind === "summary") {
        if (u.description) summaryParts.push(u.description);
        continue;
      }
      if (u.kind === "job" && u.id) {
        jobs.push({
          id: u.id,
          description: u.description || "",
          showMeta: u.showMeta !== false,
        });
        continue;
      }
      if (u.kind === "education" && u.id) {
        education.push({
          id: u.id,
          description: u.description || "",
          showMeta: u.showMeta !== false,
        });
      }
    }

    return {
      summaryHtml: summaryParts.join(""),
      education,
      jobs,
      showSkills: pageIndex === 0,
      showLanguages: pageIndex === 0,
      showReferences: pageUnits.some((u) => u.kind === "references"),
      showContact: pageUnits.some((u) => u.kind === "contact"),
    };
  });
}

function mergeSlices<T extends { id: string; description: string; showMeta: boolean }>(
  slices: T[],
): T[] {
  const merged: T[] = [];
  for (const slice of slices) {
    const prev = merged[merged.length - 1];
    if (prev && prev.id === slice.id) {
      if (!prev.description.includes(slice.description)) {
        prev.description = `${prev.description}${slice.description}`;
      }
      prev.showMeta = prev.showMeta || slice.showMeta;
    } else {
      merged.push({ ...slice });
    }
  }
  return merged;
}

function applyPagePlan(
  resume: Resume,
  plan: PagePlan,
  pageIndex: number,
): Resume {
  const mergedJobs = mergeSlices(plan.jobs);
  const mergedEdu = mergeSlices(plan.education);

  const mapJob = <T extends ExperienceItem | NoExperienceItem>(
    source: T[],
    mapFields: (item: T, slice: JobSlice) => T,
  ): T[] => {
    const out: T[] = [];
    const usedIds = new Set<string>();
    for (const slice of mergedJobs) {
      // One entry per job id per page (merged description).
      if (usedIds.has(slice.id)) continue;
      usedIds.add(slice.id);
      // re-merge slices for this id, in order
      const combined = mergedJobs
        .filter((s) => s.id === slice.id)
        .reduce(
          (acc, s) => {
            if (!acc.description.includes(s.description)) {
              acc.description += s.description;
            }
            acc.showMeta = acc.showMeta || s.showMeta;
            return acc;
          },
          { id: slice.id, description: "", showMeta: false } as JobSlice,
        );
      const item = source.find((j) => j.id === slice.id);
      if (!item) continue;
      out.push(mapFields(item, combined));
    }
    return out;
  };

  const isFirst = pageIndex === 0;

  return {
    ...resume,
    personal: {
      ...resume.personal,
      summary: plan.summaryHtml,
      photoUrl: isFirst ? resume.personal.photoUrl : "",
      fullName: isFirst ? resume.personal.fullName : "",
      jobTitle: isFirst ? resume.personal.jobTitle : "",
      email: plan.showContact ? resume.personal.email : "",
      phone: plan.showContact ? resume.personal.phone : "",
      location: plan.showContact ? resume.personal.location : "",
      nationality: plan.showContact ? resume.personal.nationality : "",
      passportId: plan.showContact ? resume.personal.passportId : "",
      website: plan.showContact ? resume.personal.website : [],
      linkedin: plan.showContact ? resume.personal.linkedin : [],
      portfolio: plan.showContact ? resume.personal.portfolio : [],
      github: plan.showContact ? resume.personal.github : [],
      gitlab: plan.showContact ? resume.personal.gitlab : [],
      stackoverflow: plan.showContact ? resume.personal.stackoverflow : [],
      telegram: plan.showContact ? resume.personal.telegram : [],
    },
    experience: mapJob(resume.experience, (item, slice) => ({
      ...item,
      description: slice.description,
      jobTitle: slice.showMeta
        ? item.jobTitle
        : item.jobTitle
          ? `${item.jobTitle} (continued)`
          : "Continued",
      company: slice.showMeta ? item.company : "",
      location: slice.showMeta ? item.location : "",
      startDate: slice.showMeta ? item.startDate : "",
      endDate: slice.showMeta ? item.endDate : "",
      current: slice.showMeta ? item.current : false,
    })),
    noExperience: mapJob(resume.noExperience, (item, slice) => ({
      ...item,
      description: slice.description,
      title: slice.showMeta
        ? item.title
        : item.title
          ? `${item.title} (continued)`
          : "Continued",
      subtitle: slice.showMeta ? item.subtitle : "",
      startDate: slice.showMeta ? item.startDate : "",
      endDate: slice.showMeta ? item.endDate : "",
      current: slice.showMeta ? item.current : false,
    })),
    education: mergedEdu
      .map((slice) => {
        const item = resume.education.find((e) => e.id === slice.id);
        if (!item) return null;
        return {
          ...item,
          description: slice.description,
          degree: slice.showMeta
            ? item.degree
            : item.degree
              ? `${item.degree} (continued)`
              : "Continued",
          school: slice.showMeta ? item.school : "",
          field: slice.showMeta ? item.field : "",
          gpa: slice.showMeta ? item.gpa : "",
          startDate: slice.showMeta ? item.startDate : "",
          endDate: slice.showMeta ? item.endDate : "",
          current: slice.showMeta ? item.current : false,
        };
      })
      .filter((e): e is EducationItem => e != null),
    skills: isFirst && plan.showSkills ? resume.skills : [],
    languages: isFirst && plan.showLanguages ? resume.languages : [],
    references: plan.showReferences ? resume.references : [],
    includeReferences: plan.showReferences && resume.includeReferences,
  };
}

function MeasureBlock({
  resume,
  unit,
}: {
  resume: Resume;
  unit: ContentUnit;
}) {
  const {
    personal,
    education,
    experience,
    noExperience,
    references,
    customization,
  } = resume;
  const fontSize = customization.fontSize || 14;
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);

  if (unit.kind === "contact") {
    const lines = personalContactLines(personal);
    return (
      <div style={{ fontSize }} className="space-y-2 py-2">
        <p className="font-bold">CONTACT</p>
        {lines.map((l, li) => (
          <p key={l.id || `contact-${li}`}>
            <ContactLink item={l} />
          </p>
        ))}
      </div>
    );
  }
  if (unit.kind === "summary") {
    return (
      <div
        className="rte-content"
        style={{ fontSize }}
        dangerouslySetInnerHTML={{
          __html: unit.description || personal.summary,
        }}
      />
    );
  }
  if (unit.kind === "education") {
    const edu = education.find((e) => e.id === unit.id);
    if (!edu) return null;
    return (
      <div style={{ fontSize }}>
        {unit.showMeta !== false && (
          <>
            <p className="font-bold">{edu.school}</p>
            <p>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</p>
            {edu.gpa && <p>{gpaText(edu.gpa, resume.customization)}</p>}
          </>
        )}
        {unit.description && hasText(unit.description) && (
          <div
            className="rte-content"
            dangerouslySetInnerHTML={{ __html: unit.description }}
          />
        )}
      </div>
    );
  }
  if (unit.kind === "job") {
    const job = jobs.find((j) => j.id === unit.id);
    if (!job) return null;
    return (
      <div style={{ fontSize }}>
        {unit.showMeta !== false && (
          <>
            <p className="font-bold">{job.jobTitle}</p>
            <p>{[job.company, job.location].filter(Boolean).join(" · ")}</p>
          </>
        )}
        {unit.description && hasText(unit.description) && (
          <div
            className="rte-content"
            dangerouslySetInnerHTML={{ __html: unit.description }}
          />
        )}
      </div>
    );
  }
  return (
    <div style={{ fontSize }} className="space-y-2">
      {references.map((r, i) => (
        <div key={r.id || `ref-${i}`}>
          <p className="font-bold">{r.name}</p>
          <p>{[r.jobTitle, r.company].filter(Boolean).join(" · ")}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Packs resume sections across pages. Content that doesn't fit is pushed
 * to the next page (same template shell, no duplicated identity chrome).
 */
export function SpecialPaginatedLayout({
  resume,
  pageWidthPx,
  pageHeightPx,
  scaleFactor,
  singlePage = false,
  pageLabelClassName = "text-text-secondary",
  pageFormat,
  pageBorder,
  pageBorderWidth,
  accent,
}: {
  resume: Resume;
  pageWidthPx: number;
  pageHeightPx: number;
  scaleFactor: number;
  singlePage?: boolean;
  pageLabelClassName?: string;
  pageFormat: "a4" | "letter";
  pageBorder?: boolean;
  pageBorderWidth?: number;
  accent?: string;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const units = useMemo(() => buildUnits(resume), [resume]);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [measured, setMeasured] = useState(false);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    const next: Record<string, number> = {};
    root.querySelectorAll<HTMLElement>("[data-unit-key]").forEach((el) => {
      const key = el.dataset.unitKey;
      if (key) next[key] = Math.ceil(el.offsetHeight);
    });
    setHeights(next);
    setMeasured(true);
  }, [resume, pageWidthPx, pageHeightPx, units]);

  const plans = useMemo(() => {
    if (!measured) {
      const jobs = normalizeJobs(resume.experience, resume.noExperience, resume.experienceOrder, resume.customization);
      return [
        {
          summaryHtml: resume.personal.summary,
          education: resume.education.map((e) => ({
            id: e.id,
            description: e.description,
            showMeta: true,
          })),
          jobs: jobs.map((j) => ({
            id: j.id,
            description: j.description,
            showMeta: true,
          })),
          showSkills: true,
          showLanguages: true,
          showReferences:
            resume.includeReferences && resume.references.length > 0,
          showContact: personalContactLines(resume.personal).length > 0,
        } satisfies PagePlan,
      ];
    }
    return packUnits(units, heights, pageHeightPx);
  }, [measured, units, heights, pageHeightPx, resume]);

  const pageResumes = useMemo(
    () => plans.map((plan, pageIndex) => applyPagePlan(resume, plan, pageIndex)),
    [plans, resume],
  );

  const visible = singlePage ? pageResumes.slice(0, 1) : pageResumes;
  const aspect = pageFormat === "letter" ? "8.5/11" : "210/297";
  const measureWidth = Math.round(pageWidthPx * 0.66);
  const bulletClass =
    resume.customization.bulletStyle === "disc"
      ? ""
      : `bullet-${resume.customization.bulletStyle}`;
  const linkIconClass = resume.customization.linkStyle.includes("icon")
    ? "resume-show-link-icons"
    : "";

  return (
    <div className="space-y-4">
      <div
        aria-hidden
        ref={measureRef}
        className={cn(bulletClass, linkIconClass, "resume-sheet")}
        lang={resumeSheetLang(resume.customization)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          width: measureWidth,
          fontFamily: cssFontStack(resume.customization.fontFamily),
          fontSize: resume.customization.fontSize,
          lineHeight:
            resume.customization.headingLanguage === "km"
              ? Math.max(resume.customization.lineHeight || 1.45, 1.6)
              : resume.customization.lineHeight || 1.45,
        }}
      >
        {units.map((unit, unitIdx) => (
          <div
            key={unit.key || `unit-${unitIdx}`}
            data-unit-key={unit.key}
            className="pb-1"
          >
            <MeasureBlock resume={resume} unit={unit} />
          </div>
        ))}
      </div>

      {visible.map((pageResume, pageIndex) => (
        <div key={pageIndex}>
          {!singlePage && pageResumes.length > 1 && (
            <p className={cn("mb-1.5 text-center text-xs", pageLabelClassName)}>
              Page {pageIndex + 1} of {pageResumes.length}
            </p>
          )}
          <div
            className="relative w-full rounded-sm border border-line shadow-xl"
            style={{
              maxWidth: pageWidthPx,
              aspectRatio: aspect,
              outline: pageBorder
                ? `${pageBorderWidth}px solid ${accent}`
                : undefined,
              outlineOffset: pageBorder ? -(pageBorderWidth || 0) : undefined,
            }}
          >
            <div className={cn("absolute inset-0 overflow-hidden rounded-sm resume-sheet", bulletClass, linkIconClass)} lang={resumeSheetLang(resume.customization)}>
              <div
                style={{
                  width: pageWidthPx,
                  height: pageHeightPx,
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: "top left",
                }}
              >
                <SpecialLayout
                  resume={pageResume}
                  pageWidthPx={pageWidthPx}
                  pageHeightPx={pageHeightPx}
                  expandHeight={false}
                  pageIndex={pageIndex}
                  totalPages={pageResumes.length}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
