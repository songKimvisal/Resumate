import { Phone, Mail, MapPin, Globe } from "lucide-react";
import {
  AtsHeading,
  JobBlock,
  PhotoBox,
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  LanguagesBlock,
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
  listKey,
} from "./shared";

/** Premium fresh grad - main narrative + navy sidebar. ATS section names. */
export default function FreshSidebarLayout({
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
  const sidebar = customization.sidebarBgColor || ATS.navy;
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;
  const nameColor = customization.toggles.fullName ? accent : undefined;
  const titleColor = customization.toggles.jobTitle ? accent : undefined;
  const mainRuleColor = customization.toggles.headings ? accent : ATS.line;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full gap-5 ${expandHeight ? "overflow-visible" : "overflow-hidden"} p-6`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-1">
        {isFirstPage && (
          <header className="mb-5">
            <h1
              className="font-bold uppercase tracking-wide"
              style={{ fontSize: customization.fullNameSize, color: nameColor }}
            >
              {personal.fullName}
            </h1>
            {personal.jobTitle && (
              <p
                className="mt-1 uppercase tracking-[0.14em]"
                style={{
                  fontSize: customization.titleSize,
                  color: titleColor || muted,
                }}
              >
                {personal.jobTitle}
              </p>
            )}
          </header>
        )}

        {hasText(personal.summary) && (
          <section className="mb-5">
            <AtsHeading title="Professional Summary" size={customization.headingsSize} ruleColor={mainRuleColor} customization={customization} />
            <RichHtml
              html={personal.summary}
              className="rte-content text-[0.9em] leading-relaxed"
              style={{ color: muted }}
            />
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mb-5">
            <AtsHeading title="Work Experience" size={customization.headingsSize} ruleColor={mainRuleColor} customization={customization} />
            <div className="space-y-4 border-l-2 pl-4" style={{ borderColor: ATS.line }}>
              {jobs.map((job, jobIdx) => (
                <div key={listKey(job.id, jobIdx, "job")} className="relative">
                  <span
                    className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <JobBlock job={job} ink={ink} muted={muted} dateFmt={dateFmt} titleFirst={false} />
                </div>
              ))}
            </div>
          </section>
        )}

        {includeReferences && references.length > 0 && (
          <section>
            <AtsHeading title="References" size={customization.headingsSize} ruleColor={mainRuleColor} customization={customization} />
            <div className="grid grid-cols-2 gap-4 text-[0.85em]">
              {references.slice(0, 4).map((r, refIdx) => (
                <div key={listKey(r.id, refIdx, "ref")}>
                  <p className="font-bold">{r.name}</p>
                  <p style={{ color: muted }}>{[r.company, r.jobTitle].filter(Boolean).join(" / ")}</p>
                  {r.phone && <p style={{ color: muted }}>{r.phone}</p>}
                  {r.email && <p style={{ color: muted }}>{r.email}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside
        className="flex h-full w-[34%] shrink-0 flex-col gap-5 overflow-hidden px-4 py-5 text-white"
        style={{ backgroundColor: sidebar, borderRadius: "20px 4px 4px 20px" }}
      >
        {isFirstPage && (
          <>
            <div className="flex justify-center">
              <PhotoBox
                personal={personal}
                customization={customization}
                borderColor="#fff"
              />
            </div>

            {contacts.length > 0 && (
              <div>
                <AtsHeading title="Contact" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.4)" customization={customization} />
                <div className="space-y-2 text-[0.8em] text-white/90">
                  {contacts.map((c, contactIdx) => (
                    <p key={listKey(c.id, contactIdx, "contact")} className="flex gap-2">
                      {c.kind === "phone" ? (
                        <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : c.kind === "email" ? (
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : c.kind === "location" ? (
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="break-all">{c.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {education.length > 0 && (
          <div>
            <AtsHeading title="Education" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.4)" customization={customization} />
            <div className="space-y-3 text-[0.8em] text-white/90">
              {education.map((edu, eduIdx) => (
                <div key={listKey(edu.id, eduIdx, "edu")}>
                  <p className="font-bold uppercase">{edu.school}</p>
                  <p>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</p>
                  <p className="opacity-80">{dateRange(edu, dateFmt)}</p>
                  {edu.gpa && <p>GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {isFirstPage && skills.length > 0 && (
          <div>
            <AtsHeading title="Skills" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.4)" customization={customization} />
            <SkillsList
              skills={skills}
              customization={customization}
              light
            />
          </div>
        )}

        {isFirstPage && languages.length > 0 && (
          <div>
            <AtsHeading title="Languages" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.4)" customization={customization} />
            <div className="text-white/90">
              <LanguagesBlock languages={languages} light />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
