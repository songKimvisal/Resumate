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

/** Hospitality classic no-photo — two equal white columns. */
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
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <header className="border-b px-10 pb-6 pt-9" style={{ borderColor: ATS.line }}>
          <h1
            className="font-semibold tracking-tight"
            style={{ fontSize: customization.fullNameSize, color: ink }}
          >
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p
              className="mt-1 font-medium"
              style={{ fontSize: customization.titleSize, color: accent }}
            >
              {personal.jobTitle}
            </p>
          )}
          <ContactInline
            contacts={contacts}
            className="mt-2.5 text-[0.82em]"
            style={{ color: muted }}
          />
        </header>
      )}

      <div className={`grid ${expandHeight ? "" : "min-h-0"} flex-1 grid-cols-2 gap-0 ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}>
        <div className="space-y-6 overflow-hidden border-r px-9 py-7" style={{ borderColor: ATS.line }}>
          {hasText(personal.summary) && (
            <section>
              <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
              <RichHtml html={personal.summary} className="rte-content text-[0.88em]" style={{ color: ink }} />
            </section>
          )}
          {education.length > 0 && (
            <section>
              <AtsHeading title="Education" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
              <div className="space-y-3 text-[0.88em]">
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
          )}
          {skills.length > 0 && (
            <section>
              <AtsHeading title="Skills" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
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
              <AtsHeading title="Languages" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
              <p className="text-[0.88em]" style={{ color: muted }}>
                {languages.map((l) => l.name).join(" · ")}
              </p>
            </section>
          )}
        </div>

        <div className="space-y-6 overflow-hidden px-9 py-7">
          {jobs.length > 0 && (
            <section>
              <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
              <div className="space-y-4">
                {jobs.map((job, jobIdx) => (
                  <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
                ))}
              </div>
            </section>
          )}
          {includeReferences && references.length > 0 && (
            <section>
              <AtsHeading title="References" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
              <div className="space-y-3 text-[0.85em]">
                {references.slice(0, 4).map((r, refIdx) => (
                  <div key={listKey(r.id, refIdx, "ref")}>
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
