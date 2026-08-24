import { Phone, Mail, MapPin, Globe, User, Briefcase } from "lucide-react";
import {
  PhotoBox,
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
} from "./shared";
import type { Customization } from "../../../types/resume";

/**
 * Dani Schwaiger–style layout:
 * left navy name band + icon timeline; right navy sidebar with circle photo.
 */
export default function TechSplitLayout({
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
  const navy = customization.sidebarBgColor || "#3C4452";
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || "#3C4452";
  const muted = "#6B7280";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const dateFmt = customization.dateFormat || "yearOnly";
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;
  const nameColor = customization.toggles.fullName ? accent : undefined;
  const titleColor = customization.toggles.jobTitle ? accent : undefined;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <main className="flex min-w-0 flex-1 flex-col">
        {isFirstPage && (
          <header className="px-7 py-5 text-white" style={{ backgroundColor: navy }}>
            <h1
              className="font-bold uppercase tracking-wide"
              style={{ fontSize: customization.fullNameSize, color: nameColor }}
            >
              {personal.fullName}
            </h1>
            {personal.jobTitle && (
              <p
                className="mt-1.5 uppercase tracking-[0.28em] text-white/90"
                style={{ fontSize: customization.titleSize, color: titleColor }}
              >
                {personal.jobTitle}
              </p>
            )}
          </header>
        )}

        <div className="relative flex-1 space-y-1 overflow-hidden px-7 py-6">
          <div
            className="absolute bottom-8 left-[2.35rem] top-8 w-px"
            style={{ backgroundColor: accent }}
          />

          {hasText(personal.summary) && (
            <IconSection
              icon={User}
              title="Profile"
              ink={navy}
              accent={accent}
              size={customization.headingsSize}
              customization={customization}
            >
              <RichHtml
                html={personal.summary}
                className="rte-content text-[0.9em] leading-relaxed"
                style={{ color: muted }}
              />
            </IconSection>
          )}

          {jobs.length > 0 && (
            <IconSection
              icon={Briefcase}
              title="Experience"
              ink={navy}
              accent={accent}
              size={customization.headingsSize}
              customization={customization}
            >
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="text-[0.88em]">
                    <p className="font-bold uppercase tracking-wide">
                      {job.jobTitle}
                    </p>
                    <p style={{ color: muted }}>
                      {[job.company, job.location, dateRange(job, dateFmt)]
                        .filter(Boolean)
                        .join("  ")}
                    </p>
                    <RichHtml
                      html={job.description}
                      className="rte-content mt-1.5 leading-relaxed"
                      style={{ color: muted }}
                    />
                  </div>
                ))}
              </div>
            </IconSection>
          )}

          {showRefs && (
            <IconSection
              icon={User}
              title="References"
              ink={navy}
              accent={accent}
              size={customization.headingsSize}
              customization={customization}
            >
              <ReferencesBlock
                references={references}
                includeReferences={includeReferences}
                muted={muted}
              />
            </IconSection>
          )}
        </div>
      </main>

      <aside
        className="flex h-full w-[34%] shrink-0 flex-col gap-5 overflow-hidden px-5 py-6 text-white"
        style={{ backgroundColor: navy }}
      >
        {isFirstPage && (
          <>
            <div className="flex justify-center pt-1">
              <PhotoBox
                personal={personal}
                customization={customization}
                borderColor="#fff"
              />
            </div>

            {contacts.length > 0 && (
              <div className="space-y-2.5 text-[0.82em]">
                {contacts.map((c) => (
                  <SideContact
                    key={c.id}
                    icon={
                      c.kind === "phone"
                        ? Phone
                        : c.kind === "email"
                          ? Mail
                          : c.kind === "location"
                            ? MapPin
                            : Globe
                    }
                    text={c.text}
                  />
                ))}
              </div>
            )}

            {skills.length > 0 && (
              <section>
                <SideHeading title="Skills" size={customization.headingsSize} customization={customization} />
                <div className="mt-2.5">
                  <SkillsList
                    skills={skills}
                    customization={customization}
                    light
                  />
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section>
                <SideHeading title="Languages" size={customization.headingsSize} customization={customization} />
                <div className="mt-2.5 text-white/90">
                  <LanguagesBlock languages={languages} light showLevel />
                </div>
              </section>
            )}
          </>
        )}

        {education.length > 0 && (
          <section>
            <SideHeading title="Education" size={customization.headingsSize} customization={customization} />
            <div className="mt-2.5 space-y-3 text-[0.85em]">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="font-bold uppercase tracking-wide">
                    {edu.degree || edu.field || edu.school}
                  </p>
                  <p className="opacity-90">
                    {[edu.school, dateRange(edu, dateFmt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {edu.gpa && <p className="opacity-80">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

function IconSection({
  icon: Icon,
  title,
  ink,
  accent,
  size,
  customization,
  children,
}: {
  icon: typeof User;
  title: string;
  ink: string;
  accent: string;
  size: number;
  customization: Customization;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-3 pb-5">
      <div className="relative z-10 flex w-7 shrink-0 flex-col items-center">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h2
          className="mb-2 font-bold"
          style={{
            fontSize: size,
            color: ink,
            ...headingCapStyle(customization),
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function SideHeading({
  title,
  size,
  customization,
}: {
  title: string;
  size: number;
  customization: Customization;
}) {
  return (
    <div>
      <h2
        className="font-bold"
        style={{
          fontSize: size,
          ...headingCapStyle(customization),
        }}
      >
        {title}
      </h2>
      <div className="mt-1.5 h-px w-full bg-white/75" />
    </div>
  );
}

function SideContact({
  icon: Icon,
  text,
}: {
  icon: typeof Phone;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-3 w-3" strokeWidth={2.2} />
      </span>
      <span className="break-all leading-snug">{text}</span>
    </div>
  );
}
