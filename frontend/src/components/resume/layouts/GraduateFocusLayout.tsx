import {
  AtsHeading,
  JobBlock,
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
} from "./shared";

/** Fresh-grad classic - education-first, soft boxed sections, no photo. */
export default function GraduateFocusLayout({
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
  const accent = customization.accentColor || "#0F2942";
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-9 py-8`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#F8FAFC")}
    >
      {isFirstPage && (
        <header className="mb-5 rounded-xl bg-white px-6 py-5 shadow-sm" style={{ borderLeft: `5px solid ${accent}` }}>
          <h1 className="font-bold tracking-tight" style={{ fontSize: customization.fullNameSize }}>
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p className="mt-1 font-semibold uppercase tracking-[0.12em]" style={{ fontSize: customization.titleSize, color: accent }}>
              {personal.jobTitle}
            </p>
          )}
          <p className="mt-2 text-[0.82em]" style={{ color: muted }}>
            {contacts.map((c) => c.text).join("  ·  ")}
          </p>
        </header>
      )}

      {education.length > 0 && (
        <section className="mb-4 rounded-xl bg-white px-6 py-4 shadow-sm">
          <AtsHeading title="Education" color={accent} size={customization.headingsSize} customization={customization} />
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="text-[0.9em]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold" style={{ fontSize: "1.05em" }}>{edu.school}</p>
                  <p className="shrink-0 tabular-nums" style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                </div>
                <p className="font-medium" style={{ color: accent }}>
                  {[edu.degree, edu.field].filter(Boolean).join(" - ")}
                </p>
                {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                <RichHtml html={edu.description} className="rte-content mt-1" style={{ color: muted }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {hasText(personal.summary) && (
        <section className="mb-4 rounded-xl bg-white px-6 py-4 shadow-sm">
          <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} customization={customization} />
          <RichHtml html={personal.summary} className="rte-content text-[0.9em]" style={{ color: muted }} />
        </section>
      )}

      {jobs.length > 0 && (
        <section className="mb-4 rounded-xl bg-white px-6 py-4 shadow-sm">
          <AtsHeading title="Experience & Projects" color={accent} size={customization.headingsSize} customization={customization} />
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobBlock key={job.id} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
            ))}
          </div>
        </section>
      )}

      {(skills.length > 0 || languages.length > 0) && (
        <section className="rounded-xl bg-white px-6 py-4 shadow-sm">
          <div className="grid grid-cols-2 gap-6">
            {skills.length > 0 && (
              <div>
                <AtsHeading title="Skills" color={accent} size={customization.headingsSize} customization={customization} />
                <SkillsList
                  skills={skills}
                  customization={customization}
                  muted={muted}
                  fill={accent}
                />
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <AtsHeading title="Languages" color={accent} size={customization.headingsSize} customization={customization} />
                <p className="text-[0.88em]" style={{ color: muted }}>
                  {languages.map((l) => l.name).join(" · ")}
                </p>
              </div>
            )}
          </div>
          {includeReferences && references.length > 0 && (
            <div className="mt-4">
              <AtsHeading title="References" color={accent} size={customization.headingsSize} customization={customization} />
              <div className="grid grid-cols-2 gap-3 text-[0.85em]">
                {references.slice(0, 2).map((r) => (
                  <div key={r.id}>
                    <p className="font-bold">{r.name}</p>
                    <p style={{ color: muted }}>{r.company}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
