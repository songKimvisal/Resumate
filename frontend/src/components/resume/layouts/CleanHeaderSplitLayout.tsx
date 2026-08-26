import { Phone, Mail, MapPin, Link2, Globe } from "lucide-react";
import {
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  LanguagesBlock,
  ReferencesBlock,
  SkillsList,
  ATS,
  headingCapStyle,
  type LayoutProps,
  layoutShellStyle,
  listKey,
} from "./shared";
import type { Customization } from "../../../types/resume";

/**
 * Denise Henderson–style layout:
 * name + contact header, then education/skills left and profile/experience timeline right.
 */
export default function CleanHeaderSplitLayout({
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
  const muted = "#6B6B6B";
  const line = "#D4D4D4";
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const contacts = personalContactLines(personal);
  const dateFmt = customization.dateFormat || "yearOnly";
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;
  const nameColor = customization.toggles.fullName ? accent : undefined;
  const titleColor = customization.toggles.jobTitle ? accent : undefined;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"} bg-white`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {isFirstPage && (
        <>
          <header className="flex items-start justify-between gap-6 px-9 pb-4 pt-8">
            <div className="min-w-0 flex-1">
              <h1
                className="font-bold leading-none tracking-tight"
                style={{ fontSize: customization.fullNameSize, color: nameColor }}
              >
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p
                  className="mt-2 uppercase tracking-[0.14em]"
                  style={{
                    fontSize: customization.titleSize,
                    color: titleColor || muted,
                  }}
                >
                  {personal.jobTitle}
                </p>
              )}
            </div>
            <div className="w-[42%] shrink-0 space-y-1.5 text-[0.8em]">
              {contacts.map((c, contactIdx) => (
                <HeaderContact
                  key={listKey(c.id, contactIdx, "contact")}
                  icon={
                    c.kind === "phone"
                      ? Phone
                      : c.kind === "email"
                        ? Mail
                        : c.kind === "location"
                          ? MapPin
                          : c.kind === "link"
                            ? Link2
                            : Globe
                  }
                  text={c.text}
                  accent={accent}
                />
              ))}
            </div>
          </header>

          <div className="mx-9 h-px" style={{ backgroundColor: line }} />
        </>
      )}

      <div className={`flex ${expandHeight ? "" : "min-h-0"} flex-1 gap-0 ${expandHeight ? "overflow-visible" : "overflow-hidden"} px-9 py-5`}>
        <aside className="w-[32%] shrink-0 space-y-5 overflow-hidden pr-6">
          {education.length > 0 && (
            <section>
              <SectionTitle title="Education" size={customization.headingsSize} color={accent} customization={customization} />
              <div className="space-y-3 text-[0.88em]">
                {education.map((edu, eduIdx) => (
                  <div key={listKey(edu.id, eduIdx, "edu")}>
                    <p className="font-bold">
                      {[edu.degree, edu.field].filter(Boolean).join(" ") ||
                        edu.school}
                    </p>
                    <p style={{ color: muted }}>{edu.school}</p>
                    <p style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                    {edu.gpa && <p style={{ color: muted }}>GPA: {edu.gpa}</p>}
                    <RichHtml
                      html={edu.description}
                      className="rte-content mt-1"
                      style={{ color: muted }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {skills.length > 0 && (
            <section>
              <SectionTitle title="Expertise" size={customization.headingsSize} color={accent} customization={customization} />
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
              <SectionTitle title="Languages" size={customization.headingsSize} color={accent} customization={customization} />
              <LanguagesBlock languages={languages} muted={muted} />
            </section>
          )}

          {showRefs && (
            <section>
              <SectionTitle title="References" size={customization.headingsSize} color={accent} customization={customization} />
              <ReferencesBlock
                references={references}
                includeReferences={includeReferences}
                muted={muted}
                max={4}
              />
            </section>
          )}
        </aside>

        <div
          className="w-px shrink-0 self-stretch"
          style={{ backgroundColor: line }}
        />

        <main className="min-w-0 flex-1 space-y-5 overflow-hidden pl-6">
          {hasText(personal.summary) && (
            <section>
              <SectionTitle title="Profile" size={customization.headingsSize} color={accent} customization={customization} />
              <RichHtml
                html={personal.summary}
                className="rte-content text-[0.9em] leading-relaxed text-justify"
                style={{ color: muted }}
              />
            </section>
          )}

          {jobs.length > 0 && (
            <section>
              <SectionTitle title="Experience" size={customization.headingsSize} color={accent} customization={customization} />
              <div className="relative mt-1 space-y-4 pl-4">
                <div
                  className="absolute bottom-2 left-[3px] top-2 w-px"
                  style={{ backgroundColor: "#BDBDBD" }}
                />
                {jobs.map((job, jobIdx) => (
                  <div key={listKey(job.id, jobIdx, "job")} className="relative text-[0.88em]">
                    <span
                      className="absolute -left-4 top-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <p className="font-bold">{job.jobTitle}</p>
                    <p style={{ color: muted }}>
                      {[job.company, job.location, dateRange(job, dateFmt)]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    <RichHtml
                      html={job.description}
                      className="rte-content mt-1.5 leading-relaxed"
                      style={{ color: muted }}
                    />
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

function HeaderContact({
  icon: Icon,
  text,
  accent,
}: {
  icon: typeof Phone;
  text: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: accent }}
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={2.4} />
      </span>
      <span className="break-all leading-snug">{text}</span>
    </div>
  );
}

function SectionTitle({
  title,
  size,
  color,
  customization,
}: {
  title: string;
  size: number;
  color: string;
  customization: Customization;
}) {
  return (
    <h2
      className="mb-2.5 font-bold"
      style={{
        fontSize: size + 1,
        color,
        ...headingCapStyle(customization),
      }}
    >
      {title}
    </h2>
  );
}
