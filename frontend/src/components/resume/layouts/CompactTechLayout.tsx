import type { ReactNode } from "react";
import type { SpecialSectionKey } from "../../../types/resume";
import { partitionSpecialSectionOrder } from "../../../lib/sectionOrder";
import {
  AtsHeading,
  JobBlock,
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  ContactInline,
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
  gpaText,
  listKey,
} from "./shared";
import { contrastOn } from "../../../lib/color";

/** Tech classic - full-width top band, left skills rail, right experience (no photo). */
export default function CompactTechLayout({
  resume,
  pageWidthPx,
  pageHeightPx,
  expandHeight = false,
  pageIndex = 0,
}: LayoutProps) {
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
  const accent = customization.accentColor || "#1D4ED8";
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const headerInk = contrastOn(accent);
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  const { main: mainOrder, sidebar: sidebarOrder } = partitionSpecialSectionOrder(
    customization.specialSectionOrder,
    customization.specialSidebarKeys,
  );

  const blocks: Partial<Record<SpecialSectionKey, ReactNode>> = {
    skills: isFirstPage && skills.length > 0 && (
      <section>
        <AtsHeading title="Technical Skills" color={accent} size={customization.headingsSize} customization={customization} />
        <SkillsList
          skills={skills}
          customization={customization}
          muted={muted}
          fill={accent}
        />
      </section>
    ),
    language: isFirstPage && languages.length > 0 && (
      <section>
        <AtsHeading title="Languages" color={accent} size={customization.headingsSize} customization={customization} />
        <ul className="space-y-1 text-[0.85em]" style={{ color: muted }}>
          {languages.map((l, langIdx) => (
            <li key={listKey(l.id, langIdx, "lang")}>{l.name}</li>
          ))}
        </ul>
      </section>
    ),
    education: education.length > 0 && (
      <section>
        <AtsHeading title="Education" color={accent} size={customization.headingsSize} customization={customization} />
        <div className="space-y-3 text-[0.85em]">
          {education.map((edu, eduIdx) => (
            <div key={listKey(edu.id, eduIdx, "edu")}>
              <p className="font-bold">{edu.school}</p>
              <p style={{ color: muted }}>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</p>
              <p style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
              {edu.gpa && <p style={{ color: muted }}>{gpaText(edu.gpa, customization)}</p>}
              {hasText(edu.description) && (
                <RichHtml
                  html={edu.description}
                  className="rte-content mt-1 leading-relaxed"
                  style={{ color: ink }}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    ),
    experience: jobs.length > 0 && (
      <section>
        <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} customization={customization} />
        <div className="space-y-4">
          {jobs.map((job, jobIdx) => (
            <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
          ))}
        </div>
      </section>
    ),
    references: includeReferences && references.length > 0 && (
      <section>
        <AtsHeading title="References" color={accent} size={customization.headingsSize} customization={customization} />
        <div className="grid grid-cols-2 gap-3 text-[0.85em]">
          {references.slice(0, 4).map((r, refIdx) => (
            <div key={listKey(r.id, refIdx, "ref")}>
              <p className="font-bold">{r.name}</p>
              <p style={{ color: muted }}>{r.company}</p>
            </div>
          ))}
        </div>
      </section>
    ),
  };
  const mainBlocks = mainOrder.map((key) => blocks[key]).filter(Boolean);
  const sidebarBlocks = sidebarOrder.map((key) => blocks[key]).filter(Boolean);

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <header className="px-9 py-7" style={{ backgroundColor: accent, color: headerInk }}>
          <h1 className="font-bold uppercase tracking-[0.14em]" style={{ fontSize: customization.fullNameSize }}>
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p className="mt-2 uppercase tracking-[0.24em] opacity-90" style={{ fontSize: customization.titleSize }}>
              {personal.jobTitle}
            </p>
          )}
          <div className="mt-4 h-[2px] w-10 rounded-full" style={{ backgroundColor: headerInk, opacity: 0.7 }} />
          <ContactInline
            contacts={contacts}
            className="mt-3 text-[0.8em] opacity-85"
          />
        </header>
      )}

      <div className={`flex ${expandHeight ? "" : "min-h-0"} flex-1 gap-0`}>
        <aside className="w-[32%] shrink-0 space-y-5 overflow-hidden px-6 py-6" style={{ backgroundColor: customization.sidebarBgColor || "#F1F5F9" }}>
          {sidebarBlocks}
        </aside>

        <main className="min-w-0 flex-1 space-y-5 overflow-hidden px-7 py-6">
          {hasText(personal.summary) && (
            <section>
              <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} customization={customization} />
              <RichHtml html={personal.summary} className="rte-content text-[0.9em] leading-relaxed" style={{ color: muted }} />
            </section>
          )}
          {mainBlocks}
        </main>
      </div>
    </div>
  );
}
