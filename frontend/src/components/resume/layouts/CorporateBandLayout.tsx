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
  listKey,
} from "./shared";

/** Banking classic - full-width navy header band (distinct from executiveCard). */
export default function CorporateBandLayout({
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
  const navy = customization.sidebarBgColor || ATS.navy;
  const accent = customization.accentColor || "#0E7490";
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
        <header className="px-9 py-7 text-white" style={{ backgroundColor: navy }}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-bold uppercase tracking-wide" style={{ fontSize: customization.fullNameSize }}>
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p className="mt-1.5 text-white/90" style={{ fontSize: customization.titleSize }}>
                  {personal.jobTitle}
                </p>
              )}
            </div>
            <div className="max-w-[42%] text-right text-[0.78em] leading-relaxed text-white/85">
              {contacts.map((c, contactIdx) => (
                <p
                  key={listKey(c.id, contactIdx, "contact")}
                  className={
                    c.kind === "email" || c.kind === "link" ? "break-all" : undefined
                  }
                >
                  {c.text}
                </p>
              ))}
            </div>
          </div>
          <div className="mt-4 h-1 w-24" style={{ backgroundColor: accent }} />
        </header>
      )}

      <div className={`flex ${expandHeight ? "" : "min-h-0"} flex-1 gap-8 ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-9 py-6`}>
        <main className="min-w-0 flex-[1.4] space-y-5">
          {hasText(personal.summary) && (
            <section>
              <AtsHeading title="Professional Summary" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
              <RichHtml html={personal.summary} className="rte-content text-[0.9em]" style={{ color: muted }} />
            </section>
          )}
          {jobs.length > 0 && (
            <section>
              <AtsHeading title="Work Experience" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
              <div className="space-y-4">
                {jobs.map((job, jobIdx) => (
                  <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="w-[34%] shrink-0 space-y-5 border-l pl-6" style={{ borderColor: ATS.line }}>
          {education.length > 0 && (
            <section>
              <AtsHeading title="Education" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
              <div className="space-y-3 text-[0.85em]">
                {education.map((edu, eduIdx) => (
                  <div key={listKey(edu.id, eduIdx, "edu")}>
                    <p className="font-bold">{edu.school}</p>
                    <p style={{ color: muted }}>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</p>
                    <p style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                    {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {skills.length > 0 && (
            <section>
              <AtsHeading title="Core Skills" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
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
              <AtsHeading title="Languages" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
              <p className="text-[0.85em]" style={{ color: muted }}>
                {languages.map((l, langIdx) => l.name).join(" · ")}
              </p>
            </section>
          )}
          {includeReferences && references.length > 0 && (
            <section>
              <AtsHeading title="References" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
              <div className="space-y-2 text-[0.82em]">
                {references.slice(0, 2).map((r, refIdx) => (
                  <div key={listKey(r.id, refIdx, "ref")}>
                    <p className="font-bold">{r.name}</p>
                    <p style={{ color: muted }}>{r.company}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
