import { Phone, Mail, Globe, MapPin } from "lucide-react";
import {
  AtsHeading,
  JobBlock,
  PhotoBox,
  RichHtml,
  hasText,
  normalizeJobs,
  personalContactLines,
  LanguagesBlock,
  ReferencesBlock,
  EducationBlock,
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
  listKey,
} from "./shared";

/** Professional charcoal sidebar - ATS-safe (no decorative ribbons). */
export default function RibbonFoldLayout({
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
  const sidebar = customization.sidebarBgColor || "#475569";
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat;
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;
  const nameColor = customization.toggles.fullName ? accent : undefined;
  const titleColor = customization.toggles.jobTitle ? accent : undefined;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <aside
        className="flex h-full w-[33%] shrink-0 flex-col text-white"
        style={{ backgroundColor: sidebar }}
      >
        {isFirstPage && (
          <div className="flex justify-center px-4 pb-4 pt-7">
            <PhotoBox
              personal={personal}
              customization={customization}
              borderColor="#fff"
            />
          </div>
        )}

        <div className={`flex flex-1 flex-col gap-5 overflow-hidden px-5 pb-6 ${isFirstPage ? "" : "pt-7"}`}>
          {hasText(personal.summary) && (
            <section>
              <AtsHeading
                title="About"
                color="#fff"
                size={customization.headingsSize}
                ruleColor="rgba(255,255,255,0.4)"
                customization={customization}
              />
              <RichHtml
                html={personal.summary}
                className="rte-content text-[0.82em] leading-relaxed text-white/90"
              />
            </section>
          )}
          {isFirstPage && skills.length > 0 && (
            <section>
              <AtsHeading
                title="Skills"
                color="#fff"
                size={customization.headingsSize}
                ruleColor="rgba(255,255,255,0.4)"
                customization={customization}
              />
              <SkillsList
                skills={skills}
                customization={customization}
                light
              />
            </section>
          )}
          {isFirstPage && languages.length > 0 && (
            <section>
              <AtsHeading
                title="Languages"
                color="#fff"
                size={customization.headingsSize}
                ruleColor="rgba(255,255,255,0.4)"
                customization={customization}
              />
              <div className="text-white/90">
                <LanguagesBlock languages={languages} light />
              </div>
            </section>
          )}
          {isFirstPage && contacts.length > 0 && (
            <section>
              <AtsHeading
                title="Contact"
                color="#fff"
                size={customization.headingsSize}
                ruleColor="rgba(255,255,255,0.4)"
                customization={customization}
              />
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
            </section>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-7 py-7">
        {isFirstPage && (
          <header className="mb-6">
            <h1
              className="font-bold leading-none"
              style={{ fontSize: customization.fullNameSize, color: nameColor }}
            >
              {personal.fullName || "Your Name"}
            </h1>
            {personal.jobTitle && (
              <p
                className="mt-2 uppercase tracking-[0.18em]"
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

        {education.length > 0 && (
          <section className="mb-5">
            <AtsHeading
              title="Education"
              size={customization.headingsSize}
              ruleColor={accent}
              customization={customization}
            />
            <div className="space-y-3">
              {education.map((edu, eduIdx) => (
                <EducationBlock
                  key={listKey(edu.id, eduIdx, "edu")}
                  edu={edu}
                  muted={muted}
                  dateFmt={dateFmt}
                />
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mb-5">
            <AtsHeading
              title="Work Experience"
              size={customization.headingsSize}
              ruleColor={accent}
              customization={customization}
            />
            <div className="space-y-4">
              {jobs.map((job, jobIdx) => (
                <JobBlock
                  key={listKey(job.id, jobIdx, "job")}
                  job={job}
                  ink={ink}
                  muted={muted}
                  dateFmt={dateFmt}
                />
              ))}
            </div>
          </section>
        )}

        {showRefs && (
          <section>
            <AtsHeading
              title="References"
              size={customization.headingsSize}
              ruleColor={accent}
              customization={customization}
            />
            <ReferencesBlock
              references={references}
              includeReferences={includeReferences}
              muted={muted}
            />
          </section>
        )}
      </main>
    </div>
  );
}
