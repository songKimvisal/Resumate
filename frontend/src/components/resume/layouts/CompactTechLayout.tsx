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
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <header className="px-8 py-6 text-white" style={{ backgroundColor: accent }}>
          <h1 className="font-bold uppercase tracking-wide" style={{ fontSize: customization.fullNameSize }}>
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p className="mt-1 uppercase tracking-[0.18em] text-white/90" style={{ fontSize: customization.titleSize }}>
              {personal.jobTitle}
            </p>
          )}
          <p className="mt-3 text-[0.8em] text-white/85">
            {contacts.map((c) => c.text).join("  ·  ")}
          </p>
        </header>
      )}

      <div className={`flex ${expandHeight ? "" : "min-h-0"} flex-1 gap-0`}>
        <aside className="w-[32%] shrink-0 space-y-5 overflow-hidden px-6 py-6" style={{ backgroundColor: customization.sidebarBgColor || "#F1F5F9" }}>
          {isFirstPage && skills.length > 0 && (
            <section>
              <AtsHeading title="Technical Skills" color={accent} size={customization.headingsSize} customization={customization} />
              <SkillsList
                skills={skills}
                customization={customization}
                muted={muted}
                fill={accent}
              />
            </section>
          )}
          {isFirstPage && languages.length > 0 && (
            <section>
              <AtsHeading title="Languages" color={accent} size={customization.headingsSize} customization={customization} />
              <ul className="space-y-1 text-[0.85em]" style={{ color: muted }}>
                {languages.map((l) => (
                  <li key={l.id}>{l.name}</li>
                ))}
              </ul>
            </section>
          )}
          {education.length > 0 && (
            <section>
              <AtsHeading title="Education" color={accent} size={customization.headingsSize} customization={customization} />
              <div className="space-y-3 text-[0.85em]">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-bold">{edu.school}</p>
                    <p style={{ color: muted }}>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</p>
                    <p style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                    {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="min-w-0 flex-1 space-y-5 overflow-hidden px-7 py-6">
          {hasText(personal.summary) && (
            <section>
              <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} customization={customization} />
              <RichHtml html={personal.summary} className="rte-content text-[0.9em] leading-relaxed" style={{ color: muted }} />
            </section>
          )}
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
              <div className="grid grid-cols-2 gap-3 text-[0.85em]">
                {references.slice(0, 4).map((r) => (
                  <div key={r.id}>
                    <p className="font-bold">{r.name}</p>
                    <p style={{ color: muted }}>{r.company}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
