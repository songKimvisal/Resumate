import { Phone, Mail, MapPin, Globe } from "lucide-react";
import {
  AtsHeading,
  JobBlock,
  RichHtml,
  hasText,
  normalizeJobs,
  personalContactLines,
  ContactLink,
  ReferencesBlock,
  EducationBlock,
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
  listKey,
  FullBleedPhoto,
} from "./shared";
import { contrastOn } from "../../../lib/color";

/** Graphic/pro sidebar — navy rail, white body, list skills. */
export default function GraphicProLayout({
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
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const contacts = personalContactLines(personal);
  const dateFmt = customization.dateFormat;
  const nameParts = (personal.fullName || "").trim().split(/\s+/);
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;
  const nameColor = contrastOn(
    sidebar,
    customization.toggles.fullName ? accent : null,
  );
  const titleColor = contrastOn(
    sidebar,
    customization.toggles.jobTitle ? accent : null,
  );

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
          <>
            <FullBleedPhoto
              personal={personal}
              customization={customization}
              fill={sidebar}
            />

            <div className="flex flex-1 flex-col gap-6 overflow-hidden px-6 py-6">
              <div>
                <h1
                  className="font-semibold leading-[1.15] tracking-tight"
                  style={{
                    fontSize: customization.fullNameSize * 0.86,
                    color: nameColor,
                  }}
                >
                  {nameParts.map((part, i) => (
                    <span key={i} className="block">
                      {part}
                    </span>
                  ))}
                </h1>
                {personal.jobTitle && (
                  <p
                    className="mt-1.5 font-medium"
                    style={{
                      fontSize: customization.titleSize,
                      color: titleColor,
                    }}
                  >
                    {personal.jobTitle}
                  </p>
                )}
                <div className="mt-3 h-px w-10 bg-white/40" />
              </div>

              {contacts.length > 0 && (
                <section>
                  <AtsHeading
                    title="Contact"
                    color="#fff"
                    size={customization.headingsSize}
                    ruleColor="rgba(255,255,255,0.35)"
                    customization={customization}
                  />
                  <div className="space-y-2 text-[0.8em] text-white/90">
                    {contacts.map((c, contactIdx) => (
                      <p key={listKey(c.id, contactIdx, "contact")} className="flex gap-2">
                        {c.kind === "phone" ? (
                          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                        ) : c.kind === "email" ? (
                          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                        ) : c.kind === "location" ? (
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                        ) : (
                          <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                        )}
                        <span className="break-all">
                          <ContactLink item={c} />
                        </span>
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {languages.length > 0 && (
                <section>
                  <AtsHeading
                    title="Languages"
                    color="#fff"
                    size={customization.headingsSize}
                    ruleColor="rgba(255,255,255,0.35)"
                    customization={customization}
                  />
                  <div className="space-y-1.5 text-[0.8em] text-white/90">
                    {languages.map((l, langIdx) => (
                      <p key={listKey(l.id, langIdx, "lang")}>{l.name}</p>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-8 py-8">
        {hasText(personal.summary) && (
          <section className="mb-5">
            <AtsHeading
              title="Professional Summary"
              color={sidebar}
              size={customization.headingsSize}
              ruleWidth="full"
              ruleColor={ATS.line}
              customization={customization}
            />
            <RichHtml
              html={personal.summary}
              className="rte-content mt-1 text-[0.9em] leading-relaxed"
              style={{ color: ink }}
            />
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mb-5">
            <AtsHeading
              title="Work Experience"
              color={sidebar}
              size={customization.headingsSize}
              ruleWidth="full"
              ruleColor={ATS.line}
              customization={customization}
            />
            <div className="mt-1 space-y-4">
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

        {education.length > 0 && (
          <section className="mb-5">
            <AtsHeading
              title="Education"
              color={sidebar}
              size={customization.headingsSize}
              ruleWidth="full"
              ruleColor={ATS.line}
              customization={customization}
            />
            <div className="space-y-3">
              {education.map((edu, eduIdx) => (
                <EducationBlock
                  key={listKey(edu.id, eduIdx, "edu")}
                  edu={edu}
                  muted={muted}
                  ink={ink}
                  dateFmt={dateFmt}
                />
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section className="mb-5">
            <AtsHeading
              title="Skills"
              color={sidebar}
              size={customization.headingsSize}
              ruleWidth="full"
              ruleColor={ATS.line}
              customization={customization}
            />
            <div className="mt-2">
              <SkillsList
                skills={skills}
                customization={customization}
                muted={ink}
                fill={sidebar}
              />
            </div>
          </section>
        )}

        {showRefs && (
          <section>
            <AtsHeading
              title="References"
              color={sidebar}
              size={customization.headingsSize}
              ruleWidth="full"
              ruleColor={ATS.line}
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
