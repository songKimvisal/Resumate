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
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat || "monthYear";
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`relative flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-10 py-9`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[5px]" style={{ backgroundColor: accent }} />

      {isFirstPage && (
        <header className="mb-6 border-b pb-5" style={{ borderColor: ATS.line }}>
          <h1
            className="font-bold uppercase tracking-tight"
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
          <p className="mt-3 text-[0.85em]" style={{ color: muted }}>
            {contacts.map((c) => c.text).join("  ·  ")}
          </p>
        </header>
      )}

      {hasText(personal.summary) && (
        <section className="mb-5">
          <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
          <RichHtml
            html={personal.summary}
            className="rte-content text-[0.92em] leading-relaxed"
            style={{ color: muted }}
          />
        </section>
      )}

      {jobs.length > 0 && (
        <section className="mb-5">
          <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobBlock key={job.id} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-5">
          <AtsHeading title="Education" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
          <div className="space-y-3 text-[0.9em]">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">
                    {[edu.degree, edu.field].filter(Boolean).join(" - ") || edu.school}
                  </p>
                  <p className="shrink-0 tabular-nums" style={{ color: muted }}>
                    {dateRange(edu, dateFmt)}
                  </p>
                </div>
                <p style={{ color: muted }}>{edu.school}</p>
                {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {(skills.length > 0 || languages.length > 0) && (
        <div className="mb-5 grid grid-cols-2 gap-8">
          {skills.length > 0 && (
            <section>
              <AtsHeading title="Skills" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
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
              <AtsHeading title="Languages" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
              <p className="text-[0.9em]" style={{ color: muted }}>
                {languages.map((l) => l.name).join(" · ")}
              </p>
            </section>
          )}
        </div>
      )}

      {includeReferences && references.length > 0 && (
        <section>
          <AtsHeading title="References" color={accent} size={customization.headingsSize} ruleColor={ATS.line} customization={customization} />
          <div className="grid grid-cols-2 gap-4 text-[0.88em]">
            {references.slice(0, 4).map((r) => (
              <div key={r.id}>
                <p className="font-bold">{r.name}</p>
                <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(" · ")}</p>
                {r.phone && <p style={{ color: muted }}>{r.phone}</p>}
                {r.email && <p style={{ color: muted }}>{r.email}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
