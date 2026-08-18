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

/** Hospitality classic no-photo — warm equal two-column split. */
export default function WarmColumnsLayout({
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
  const accent = customization.accentColor || "#B45309";
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFBF7")}
    >
      {isFirstPage && (
        <header className="border-b-4 px-9 py-6" style={{ borderColor: accent }}>
          <h1 className="font-bold uppercase tracking-wide" style={{ fontSize: customization.fullNameSize }}>
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p className="mt-1 font-medium" style={{ fontSize: customization.titleSize, color: accent }}>
              {personal.jobTitle}
            </p>
          )}
          <p className="mt-2 text-[0.82em]" style={{ color: muted }}>
            {contacts.map((c) => c.text).join("   ·   ")}
          </p>
        </header>
      )}

      <div className={`grid ${expandHeight ? "" : "min-h-0"} flex-1 grid-cols-2 gap-0 ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}>
        <div className="space-y-5 overflow-hidden border-r px-7 py-6" style={{ borderColor: ATS.line }}>
          {hasText(personal.summary) && (
            <section>
              <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} customization={customization} />
              <RichHtml html={personal.summary} className="rte-content text-[0.88em]" style={{ color: muted }} />
            </section>
          )}
          {education.length > 0 && (
            <section>
              <AtsHeading title="Education" color={accent} size={customization.headingsSize} customization={customization} />
              <div className="space-y-3 text-[0.88em]">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-bold">{edu.school}</p>
                    <p style={{ color: muted }}>{[edu.degree, edu.field].filter(Boolean).join(" — ")}</p>
                    <p style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                    {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {skills.length > 0 && (
            <section>
              <AtsHeading title="Skills" color={accent} size={customization.headingsSize} customization={customization} />
              <SkillsList
                skills={skills}
                customization={customization}
                muted={muted}
                fill={accent}
              />
            </section>
          )}
          {languages.length > 0 && (
            <section>
              <AtsHeading title="Languages" color={accent} size={customization.headingsSize} customization={customization} />
              <p className="text-[0.88em]" style={{ color: muted }}>
                {languages.map((l) => l.name).join(" · ")}
              </p>
            </section>
          )}
        </div>

        <div className="space-y-5 overflow-hidden px-7 py-6">
          {jobs.length > 0 && (
            <section>
              <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} customization={customization} />
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobBlock key={job.id} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
                ))}
              </div>
            </section>
          )}
          {includeReferences && references.length > 0 && (
            <section>
              <AtsHeading title="References" color={accent} size={customization.headingsSize} customization={customization} />
              <div className="space-y-3 text-[0.85em]">
                {references.slice(0, 4).map((r) => (
                  <div key={r.id}>
                    <p className="font-bold">{r.name}</p>
                    <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(" · ")}</p>
                    {r.phone && <p style={{ color: muted }}>{r.phone}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
