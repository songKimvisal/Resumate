import {
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  Contact,
  Languages,
} from "lucide-react";
import {
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  ContactLink,
  LanguagesBlock,
  ReferencesBlock,
  SkillsList,
  headingCapStyle,
  type LayoutProps,
  layoutShellStyle,
  gpaText,
  listKey,
  FullBleedPhoto,
} from "./shared";
import type { Customization } from "../../../types/resume";
import { resumeHeading } from "../../../lib/resumeHeadings";
import { contrastOn } from "../../../lib/color";

/**
 * Isabel Mercado–style layout:
 * monochrome, pill section headers with icons.
 */
export default function MonoPillLayout({
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
  const charcoal =
    customization.sidebarBgColor || customization.accentColor || "#2F2F2F";
  const ink = customization.bodyTextColor || "#1A1A1A";
  const muted = "#5A5A5A";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat || "yearOnly";
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"} bg-white`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <aside className="flex h-full w-[34%] shrink-0 flex-col gap-5 overflow-hidden px-5 py-6">
        {isFirstPage && (
          <>
            <FullBleedPhoto
              personal={personal}
              customization={customization}
              aspectRatio="1 / 1.05"
              fill={charcoal}
            />

            <div>
              <h1
                className="font-bold uppercase leading-tight tracking-[0.12em]"
                style={{ fontSize: customization.fullNameSize }}
              >
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p
                  className="mt-2 uppercase tracking-[0.18em]"
                  style={{ fontSize: customization.titleSize, color: muted }}
                >
                  {personal.jobTitle}
                </p>
              )}
              <div className="mt-3 h-[2px] w-9 rounded-full" style={{ backgroundColor: charcoal }} />
            </div>

            {contacts.length > 0 && (
              <section>
                <PillHeading
                  title="Contact"
                  icon={Contact}
                  color={charcoal}
                  size={customization.headingsSize}
                  customization={customization}
                />
                <div className="mt-3 space-y-2.5 text-[0.82em]">
                  {contacts.map((c, contactIdx) => (
                    <ContactLine
                      key={listKey(c.id, contactIdx, "contact")}
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
                      href={c.href}
                    />
                  ))}
                </div>
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <PillHeading
                  title="Skills"
                  icon={Sparkles}
                  color={charcoal}
                  size={customization.headingsSize}
                  customization={customization}
                />
                <div className="mt-3">
                  <SkillsList
                    skills={skills}
                    customization={customization}
                    muted={ink}
                    fill={charcoal}
                  />
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section>
                <PillHeading
                  title="Languages"
                  icon={Languages}
                  color={charcoal}
                  size={customization.headingsSize}
                  customization={customization}
                />
                <div className="mt-3">
                  <LanguagesBlock languages={languages} muted={muted} />
                </div>
              </section>
            )}
          </>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden px-6 py-6">
        {hasText(personal.summary) && (
          <section>
            <PillHeading
              title="About Me"
              icon={User}
              color={charcoal}
              size={customization.headingsSize}
              customization={customization}
            />
            <RichHtml
              html={personal.summary}
              className="rte-content mt-3 text-[0.88em] leading-relaxed text-justify"
              style={{ color: ink }}
            />
          </section>
        )}

        {education.length > 0 && (
          <section>
            <PillHeading
              title="Education"
              icon={GraduationCap}
              color={charcoal}
              size={customization.headingsSize}
              customization={customization}
            />
            <div className="relative mt-3 space-y-4 pl-4">
              <div
                className="absolute bottom-1 left-[3px] top-1 w-px"
                style={{ backgroundColor: charcoal }}
              />
              {education.map((edu, eduIdx) => (
                <div key={listKey(edu.id, eduIdx, "edu")} className="relative text-[0.88em]">
                  <span
                    className="absolute -left-4 top-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: charcoal }}
                  />
                  <p className="font-bold">
                    {[edu.degree, edu.field].filter(Boolean).join(" ") ||
                      edu.school}
                  </p>
                  <p style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
                  <p className="italic" style={{ color: muted }}>
                    {edu.school}
                  </p>
                  {edu.gpa && <p style={{ color: muted }}>{gpaText(edu.gpa, customization)}</p>}
                  <RichHtml
                    html={edu.description}
                    className="rte-content mt-1"
                    style={{ color: ink }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section>
            <PillHeading
              title="Work Experience"
              icon={Briefcase}
              color={charcoal}
              size={customization.headingsSize}
              customization={customization}
            />
            <div className="relative mt-3 space-y-4 pl-4">
              <div
                className="absolute bottom-1 left-[3px] top-1 w-px"
                style={{ backgroundColor: charcoal }}
              />
              {jobs.map((job, jobIdx) => (
                <div key={listKey(job.id, jobIdx, "job")} className="relative text-[0.88em]">
                  <span
                    className="absolute -left-4 top-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: charcoal }}
                  />
                  <p className="font-bold">{job.company || job.jobTitle}</p>
                  <p style={{ color: muted }}>{dateRange(job, dateFmt)}</p>
                  {job.company && job.jobTitle && (
                    <p className="font-semibold">{job.jobTitle}</p>
                  )}
                  {job.location && (
                    <p style={{ color: muted }}>{job.location}</p>
                  )}
                  <RichHtml
                    html={job.description}
                    className="rte-content mt-1 leading-relaxed"
                    style={{ color: ink }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {showRefs && (
          <section>
            <PillHeading
              title="References"
              icon={Contact}
              color={charcoal}
              size={customization.headingsSize}
              customization={customization}
            />
            <div className="mt-3">
              <ReferencesBlock
                references={references}
                includeReferences={includeReferences}
                muted={muted}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function PillHeading({
  title,
  icon: Icon,
  color,
  size,
  customization,
}: {
  title: string;
  icon: typeof User;
  color: string;
  size: number;
  customization: Customization;
}) {
  const border = customization.headingBorder;
  const label = resumeHeading(title, customization);
  const titleStyle = {
    fontSize: size,
    ...headingCapStyle(customization),
  };

  if (border === "line") {
    return (
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-bold" style={{ ...titleStyle, color }}>
          {label}
        </span>
        <span className="h-px min-w-4 flex-1" style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (border === "underline") {
    return (
      <div>
        <span className="font-bold" style={{ ...titleStyle, color }}>
          {label}
        </span>
        <div className="mt-1.5 h-px w-full" style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (border === "outline") {
    return (
      <div
        className="inline-flex max-w-full items-center gap-2 rounded-r-full py-1.5 pl-2.5 pr-5"
        style={{ border: `1.5px solid ${color}`, color }}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5">
          <Icon className="h-3 w-3" strokeWidth={2.2} />
        </span>
        <span className="font-bold" style={titleStyle}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex max-w-full items-center gap-2 rounded-r-full py-1.5 pl-2.5 pr-5"
      style={{ backgroundColor: color, color: contrastOn(color) }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-3 w-3" strokeWidth={2.2} />
      </span>
      <span className="font-bold" style={titleStyle}>
        {label}
      </span>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  text,
  href,
}: {
  icon: typeof Phone;
  text: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="break-all leading-snug">
        <ContactLink item={{ id: text, text, kind: "link", href }} />
      </span>
    </div>
  );
}
