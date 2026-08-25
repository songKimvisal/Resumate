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

/** Designer classic - centered editorial header, double rules, no photo. */
export default function EditorialClassicLayout({
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
  const accent = customization.accentColor || "#0F172A";
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-12 py-10`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <header className="mb-7 text-center">
          <div className="mx-auto mb-3 h-px w-24" style={{ backgroundColor: accent }} />
          <h1
            className="font-bold uppercase tracking-[0.2em]"
            style={{ fontSize: customization.fullNameSize }}
          >
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p
              className="mt-2 italic"
              style={{ fontSize: customization.titleSize, color: muted }}
            >
              {personal.jobTitle}
            </p>
          )}
          <p className="mt-3 text-[0.8em]" style={{ color: muted }}>
            {contacts.map((c) => c.text).join("  |  ")}
          </p>
          <div className="mx-auto mt-4 h-[2px] w-full max-w-md" style={{ backgroundColor: accent }} />
          <div className="mx-auto mt-1 h-px w-full max-w-md" style={{ backgroundColor: accent }} />
        </header>
      )}

      {hasText(personal.summary) && (
        <section className="mb-5">
          <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} customization={customization} />
          <RichHtml
            html={personal.summary}
            className="rte-content text-center text-[0.9em] leading-relaxed"
            style={{ color: muted }}
          />
        </section>
      )}

      {jobs.length > 0 && (
        <section className="mb-5">
          <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} customization={customization} />
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobBlock key={job.id} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-5 grid grid-cols-2 gap-8">
        {education.length > 0 && (
          <section>
            <AtsHeading title="Education" color={accent} size={customization.headingsSize} customization={customization} />
            <div className="space-y-3 text-[0.88em]">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="font-bold">{edu.school}</p>
                  <p style={{ color: muted }}>
                    {[edu.degree, edu.field].filter(Boolean).join(" - ")}
                  </p>
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
            {languages.length > 0 && (
              <>
                <div className="mt-4">
                  <AtsHeading title="Languages" color={accent} size={customization.headingsSize} customization={customization} />
                </div>
                <p className="text-[0.88em]" style={{ color: muted }}>
                  {languages.map((l) => l.name).join(" · ")}
                </p>
              </>
            )}
          </section>
        )}
      </div>

      {includeReferences && references.length > 0 && (
        <section>
          <AtsHeading title="References" color={accent} size={customization.headingsSize} customization={customization} />
          <div className="grid grid-cols-2 gap-4 text-[0.85em]">
            {references.slice(0, 4).map((r) => (
              <div key={r.id}>
                <p className="font-bold">{r.name}</p>
                <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
