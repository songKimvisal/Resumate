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
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-12 py-10`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <header className="mb-8 text-center">
          <h1
            className="font-semibold tracking-tight"
            style={{ fontSize: customization.fullNameSize, color: ink }}
          >
            {personal.fullName}
          </h1>
          {personal.jobTitle && (
            <p
              className="mt-1.5 font-medium"
              style={{ fontSize: customization.titleSize, color: accent }}
            >
              {personal.jobTitle}
            </p>
          )}
          <ContactInline
            contacts={contacts}
            className="mt-3 text-[0.8em]"
            style={{ color: muted }}
          />
          <div className="mx-auto mt-5 h-px w-full" style={{ backgroundColor: ATS.line }} />
        </header>
      )}

      {hasText(personal.summary) && (
        <section className="mb-5">
          <AtsHeading title="Professional Summary" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
          <RichHtml
            html={personal.summary}
            className="rte-content text-center text-[0.9em] leading-relaxed"
            style={{ color: ink }}
          />
        </section>
      )}

      {jobs.length > 0 && (
        <section className="mb-5">
          <AtsHeading title="Work Experience" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
          <div className="space-y-4">
            {jobs.map((job, jobIdx) => (
              <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-5 grid grid-cols-2 gap-8">
        {education.length > 0 && (
          <section>
            <AtsHeading title="Education" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
            <div className="space-y-3 text-[0.88em]">
              {education.map((edu, eduIdx) => (
                <div key={listKey(edu.id, eduIdx, "edu")}>
                  <p className="font-bold">{edu.school}</p>
                  <p style={{ color: muted }}>
                    {[edu.degree, edu.field].filter(Boolean).join(" - ")}
                  </p>
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
            {languages.length > 0 && (
              <>
                <div className="mt-4">
                  <AtsHeading title="Languages" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
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
          <AtsHeading title="References" color={accent} size={customization.headingsSize} ruleWidth="full" ruleColor={ATS.line} customization={customization} />
          <div className="grid grid-cols-2 gap-4 text-[0.85em]">
            {references.slice(0, 4).map((r, refIdx) => (
              <div key={listKey(r.id, refIdx, "ref")}>
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
