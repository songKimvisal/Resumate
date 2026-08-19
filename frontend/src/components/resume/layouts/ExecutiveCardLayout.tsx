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
  SkillsList,
  ATS,
  type LayoutProps,
  layoutShellStyle,
} from "./shared";

/** Executive navy card — polished professional, ATS-readable text. */
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
  const jobs = normalizeJobs(experience, noExperience);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;
  const nameColor = customization.toggles.fullName ? accent : navy;
  const titleColor = customization.toggles.jobTitle ? accent : muted;

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
            <RichHtml html={personal.summary} className="rte-content text-[0.78em] leading-relaxed text-white/90" />
          </section>
        )}
        {isFirstPage && (
          <section>
            <AtsHeading title="Contact" color="#fff" size={customization.headingsSize} ruleColor="rgba(255,255,255,0.35)" customization={customization} />
            <div className="space-y-2 text-[0.78em] text-white/90">
              {contacts.map((c) => (
                <p key={c.id} className="flex gap-2">
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
              {languages.map((l) => (
                <li key={l.id}>{l.name}</li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-7 pb-6 pt-8">
        {isFirstPage && (
          <header className="mb-6 pr-[28%]">
            <p className="uppercase tracking-wide" style={{ color: nameColor, fontSize: customization.titleSize }}>
              {firstName}
            </p>
            <h1 className="font-bold uppercase leading-none" style={{ color: nameColor, fontSize: customization.fullNameSize }}>
              {lastName || firstName}
            </h1>
            {personal.jobTitle && (
              <p className="mt-2 font-medium" style={{ color: titleColor }}>{personal.jobTitle}</p>
            )}
          </header>
        )}

        {jobs.length > 0 && (
          <section className="mb-5">
            <AtsHeading title="Work Experience" color={navy} size={customization.headingsSize} ruleColor={`${accent}44`} customization={customization} />
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobBlock key={job.id} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className="mb-5">
            <AtsHeading title="Education" color={navy} size={customization.headingsSize} ruleColor={`${accent}44`} customization={customization} />
            <div className="space-y-3 text-[0.9em]">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-bold">{edu.school}</p>
                    <p className="shrink-0 tabular-nums" style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                  </div>
                  <p style={{ color: muted }}>{[edu.degree, edu.field].filter(Boolean).join(" — ")}</p>
                  {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {includeReferences && references.length > 0 && (
          <section>
            <AtsHeading title="References" color={navy} size={customization.headingsSize} ruleColor={`${accent}44`} customization={customization} />
            <div className="grid grid-cols-2 gap-4 text-[0.85em]">
              {references.slice(0, 4).map((r) => (
                <div key={r.id}>
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
