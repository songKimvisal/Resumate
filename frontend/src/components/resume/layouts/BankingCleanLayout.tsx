import { Phone, Mail, Globe, MapPin } from "lucide-react";
import { LANGUAGE_LEVEL_LABELS } from "../../../types/resume";
import {
  AtsHeading,
  JobBlock,
  PhotoBox,
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

/** Premium banking — classic header + two columns. Highly ATS-readable. */
export default function BankingCleanLayout({
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
  const accent = customization.accentColor || "#0E7490";
  const footer = customization.sidebarBgColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`relative flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {customization.topAccentBar && (
        <div className="absolute left-0 top-0 z-10 h-2.5 w-[18%]" style={{ backgroundColor: accent }} />
      )}

      <div className="flex flex-1 flex-col px-8 pb-5 pt-9">
        {isFirstPage && (
          <header className="mb-6 flex items-start gap-5 border-b pb-5" style={{ borderColor: ATS.line }}>
            <PhotoBox personal={personal} customization={customization} />
            <div className="min-w-0 flex-1">
              <h1
                className="font-semibold uppercase tracking-[0.06em]"
                style={{ fontSize: customization.fullNameSize }}
              >
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p className="mt-1 font-medium" style={{ fontSize: customization.titleSize, color: accent }}>
                  {personal.jobTitle}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.82em]" style={{ color: muted }}>
                {contacts.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5">
                    {c.kind === "phone" ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : c.kind === "email" ? (
                      <Mail className="h-3.5 w-3.5" />
                    ) : c.kind === "location" ? (
                      <MapPin className="h-3.5 w-3.5" />
                    ) : (
                      <Globe className="h-3.5 w-3.5" />
                    )}
                    {c.text}
                  </span>
                ))}
              </div>
            </div>
          </header>
        )}

        <div className={`flex ${expandHeight ? "" : "min-h-0"} flex-1 gap-8`}>
          <div className="w-[34%] shrink-0 space-y-5">
            {hasText(personal.summary) && (
              <section>
                <AtsHeading title="Summary" size={customization.headingsSize} ruleColor={accent} customization={customization} />
                <RichHtml
                  html={personal.summary}
                  className="rte-content text-[0.88em] leading-relaxed text-justify"
                  style={{ color: muted }}
                />
              </section>
            )}
            {education.length > 0 && (
              <section>
                <AtsHeading title="Education" size={customization.headingsSize} ruleColor={accent} customization={customization} />
                <div className="space-y-3 text-[0.88em]">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <p className="font-bold">
                        {[edu.degree, edu.field].filter(Boolean).join(" ") || edu.school}
                      </p>
                      <p style={{ color: muted }}>{edu.school}</p>
                      <p className="tabular-nums" style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                      {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {skills.length > 0 && (
              <section>
                <AtsHeading title="Skills" size={customization.headingsSize} ruleColor={accent} customization={customization} />
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
                <AtsHeading title="Languages" size={customization.headingsSize} ruleColor={accent} customization={customization} />
                <ul className="space-y-1 text-[0.88em]" style={{ color: muted }}>
                  {languages.map((l) => (
                    <li key={l.id}>
                      {l.name}
                      {l.level >= 1 && l.level <= 5
                        ? ` — ${LANGUAGE_LEVEL_LABELS[l.level - 1]}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            {jobs.length > 0 && (
              <section>
                <AtsHeading title="Work Experience" size={customization.headingsSize} ruleColor={accent} customization={customization} />
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobBlock key={job.id} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
                  ))}
                </div>
              </section>
            )}
            {includeReferences && references.length > 0 && (
              <section>
                <AtsHeading title="References" size={customization.headingsSize} ruleColor={accent} customization={customization} />
                <div className="grid grid-cols-2 gap-4 text-[0.85em]">
                  {references.slice(0, 4).map((r) => (
                    <div key={r.id}>
                      <p className="font-bold">{r.name}</p>
                      <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(", ")}</p>
                      {r.phone && <p style={{ color: muted }}>Phone: {r.phone}</p>}
                      {r.email && <p style={{ color: muted }}>Email: {r.email}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {customization.footerBar && (
        <div className="h-2.5 w-full shrink-0" style={{ backgroundColor: footer }} />
      )}
    </div>
  );
}
