import { Phone, Mail, Globe, MapPin } from "lucide-react";
import {
  AtsHeading,
  JobBlock,
  PhotoBox,
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  ContactLink,
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
  gpaText,
  listKey,
} from "./shared";
import { contrastOn } from "../../../lib/color";

/** Executive navy card - polished professional, ATS-readable text. */
export default function ExecutiveCardLayout({
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
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const nameParts = (personal.fullName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;
  const nameColor = contrastOn(
    "#FFFFFF",
    customization.toggles.fullName ? accent : navy,
  );
  const titleColor = contrastOn(
    "#FFFFFF",
    customization.toggles.jobTitle ? accent : muted,
  );

  return (
    <div
      className={`relative flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <div
          className="absolute right-0 top-0 z-10 flex items-center justify-center overflow-hidden"
          style={{
            width: "26%",
            height: "24%",
            backgroundColor: navy,
            borderBottomLeftRadius: 40,
          }}
        >
          <PhotoBox
            personal={personal}
            customization={customization}
            borderColor="#fff"
          />
        </div>
      )}

      <aside
        className="mt-auto flex h-[86%] w-[33%] shrink-0 flex-col gap-4 overflow-hidden px-5 pb-6 pt-10 text-white"
        style={{ backgroundColor: navy, borderTopRightRadius: 56 }}
      >
        {hasText(personal.summary) && (
          <section>
            <AtsHeading title="About" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.35)" customization={customization} />
            <RichHtml
              html={personal.summary}
              className="rte-content rte-on-dark text-[0.78em] leading-relaxed"
              style={{ color: ATS.onDark }}
            />
          </section>
        )}
        {isFirstPage && (
          <section>
            <AtsHeading title="Contact" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.35)" customization={customization} />
            <div className="space-y-2 text-[0.78em] text-white/90">
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
                  <span className="break-all">
                    <ContactLink item={c} />
                  </span>
                </p>
              ))}
            </div>
          </section>
        )}
        {isFirstPage && skills.length > 0 && (
          <section>
            <AtsHeading title="Skills" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.35)" customization={customization} />
            <SkillsList
              skills={skills}
              customization={customization}
              light
            />
          </section>
        )}
        {isFirstPage && languages.length > 0 && (
          <section>
            <AtsHeading title="Languages" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.35)" customization={customization} />
            <ul className="space-y-1 text-[0.78em] text-white/90">
              {languages.map((l, langIdx) => (
                <li key={listKey(l.id, langIdx, "lang")}>{l.name}</li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-7 pb-6 pt-8">
        {isFirstPage && (
          <header className="mb-7 pr-[28%]">
            <p className="uppercase tracking-[0.28em]" style={{ color: nameColor, fontSize: customization.titleSize }}>
              {firstName}
            </p>
            <h1 className="mt-1 font-bold uppercase leading-none tracking-tight" style={{ color: nameColor, fontSize: customization.fullNameSize }}>
              {lastName || firstName}
            </h1>
            {personal.jobTitle && (
              <p className="mt-2.5 font-medium tracking-wide" style={{ color: titleColor }}>{personal.jobTitle}</p>
            )}
            <div className="mt-4 h-[2px] w-10 rounded-full" style={{ backgroundColor: accent }} />
          </header>
        )}

        {jobs.length > 0 && (
          <section className="mb-5">
            <AtsHeading title="Work Experience" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
            <div className="space-y-4">
              {jobs.map((job, jobIdx) => (
                <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className="mb-5">
            <AtsHeading title="Education" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
            <div className="space-y-3 text-[0.9em]">
              {education.map((edu, eduIdx) => (
                <div key={listKey(edu.id, eduIdx, "edu")}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-bold">{edu.school}</p>
                    <p className="shrink-0 tabular-nums" style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                  </div>
                  <p style={{ color: muted }}>{[edu.degree, edu.field].filter(Boolean).join(" - ")}</p>
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

        {includeReferences && references.length > 0 && (
          <section>
            <AtsHeading title="References" color={navy} size={customization.headingsSize} ruleColor={accent} customization={customization} />
            <div className="grid grid-cols-2 gap-4 text-[0.85em]">
              {references.slice(0, 4).map((r, refIdx) => (
                <div key={listKey(r.id, refIdx, "ref")}>
                  <p className="font-bold">{r.name}</p>
                  <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(" / ")}</p>
                  {r.phone && <p style={{ color: muted }}>Phone: {r.phone}</p>}
                  {r.email && <p style={{ color: muted }}>Email: {r.email}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
