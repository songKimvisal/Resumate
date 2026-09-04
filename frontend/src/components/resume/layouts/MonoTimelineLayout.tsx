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

/**
 * Single-column ATS-first premium layout.
 * Best parseability: one reading column, standard headings, clear dates.
 */
export default function MonoTimelineLayout({
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
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat || "monthYear";
  const isFirstPage = pageIndex === 0;

  const { main: mainOrder, sidebar: sidebarOrder } = partitionSpecialSectionOrder(
    customization.specialSectionOrder,
    customization.specialSidebarKeys,
  );

  const blocks: Partial<Record<SpecialSectionKey, ReactNode>> = {
    experience: jobs.length > 0 && (
      <section>
        <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} ruleColor={accent} customization={customization} />
        <div className="space-y-4">
          {jobs.map((job, jobIdx) => (
            <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
          ))}
        </div>
      </section>
    ),
    education: education.length > 0 && (
      <section>
        <AtsHeading title="Education" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
        <div className="space-y-3 text-[0.9em]">
          {education.map((edu, eduIdx) => (
            <div key={listKey(edu.id, eduIdx, "edu")}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-bold">
                  {[edu.degree, edu.field].filter(Boolean).join(" - ") || edu.school}
                </p>
                <p className="shrink-0 tabular-nums" style={{ color: muted }}>
                  {dateRange(edu, dateFmt)}
                </p>
              </div>
              <p style={{ color: muted }}>{edu.school}</p>
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
    skills: skills.length > 0 && (
      <section>
        <AtsHeading title="Skills" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
        <SkillsList
          skills={skills}
          customization={customization}
          muted={muted}
          fill={accent}
        />
      </section>
    ),
    language: languages.length > 0 && (
      <section>
        <AtsHeading title="Languages" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
        <p className="text-[0.9em]" style={{ color: muted }}>
          {languages.map((l) => l.name).join(" · ")}
        </p>
      </section>
    ),
    references: includeReferences && references.length > 0 && (
      <section>
        <AtsHeading title="References" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
        <div className="grid grid-cols-2 gap-4 text-[0.88em]">
          {references.slice(0, 4).map((r, refIdx) => (
            <div key={listKey(r.id, refIdx, "ref")}>
              <p className="font-bold">{r.name}</p>
              <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(" · ")}</p>
              {r.phone && <p style={{ color: muted }}>{r.phone}</p>}
              {r.email && <p style={{ color: muted }}>{r.email}</p>}
            </div>
          ))}
        </div>
      </section>
    ),
  };
  const orderedBlocks = [...mainOrder, ...sidebarOrder]
    .map((key) => blocks[key])
    .filter(Boolean);

  return (
    <div
      className={`relative flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-10 py-9`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[5px]" style={{ backgroundColor: accent }} />

      {isFirstPage && (
        <header className="mb-7 border-b pb-6" style={{ borderColor: ATS.line }}>
          <h1
            className="font-bold uppercase tracking-[0.12em]"
            style={{ fontSize: customization.fullNameSize }}
          >
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p
              className="mt-1.5 font-semibold uppercase tracking-[0.16em]"
              style={{ fontSize: customization.titleSize, color: accent }}
            >
              {personal.jobTitle}
            </p>
          )}
          <ContactInline
            contacts={contacts}
            className="mt-3 text-[0.85em]"
            style={{ color: muted }}
          />
        </header>
      )}

      <div className="space-y-5">
        {hasText(personal.summary) && (
          <section>
            <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} ruleColor={accent} customization={customization} />
            <RichHtml
              html={personal.summary}
              className="rte-content text-[0.92em] leading-relaxed"
              style={{ color: ink }}
            />
          </section>
        )}
        {orderedBlocks}
      </div>
    </div>
  );
}
