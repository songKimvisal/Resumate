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
import { photoImgStyle } from "../../../lib/photoFit";
import {
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  LanguagesBlock,
  ReferencesBlock,
  headingCapStyle,
  type LayoutProps,
  layoutShellStyle,
} from "./shared";
import type { Customization } from "../../../types/resume";

/**
 * Isabel Mercado–style layout:
 * monochrome, pill section headers with icons, skill dots, timeline on right.
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
  const jobs = normalizeJobs(experience, noExperience);
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
            <div
              className="w-full shrink-0 overflow-hidden"
              style={{ aspectRatio: "1 / 1.05", backgroundColor: "#E8E8E8" }}
            >
              {customization.showPhoto && personal.photoUrl ? (
                <img
                  src={personal.photoUrl}
                  alt={personal.fullName || "Profile"}
                  className="h-full w-full object-cover"
                  style={photoImgStyle(personal)}
                />
              ) : null}
            </div>

            <div>
              <h1
                className="font-bold uppercase leading-tight tracking-wide"
                style={{ fontSize: customization.fullNameSize }}
              >
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p
                  className="mt-1.5 uppercase tracking-[0.12em]"
                  style={{ fontSize: customization.titleSize, color: muted }}
                >
                  {personal.jobTitle}
                </p>
              )}
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
                  {contacts.map((c) => (
                    <ContactLine
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
                <div className="mt-3 space-y-2.5">
                  {skills.map((s) => (
                    <div key={s.id} className="text-[0.82em]">
                      <p className="mb-1 font-medium">{s.name}</p>
                      {customization.skillsDisplay !== "list" &&
                      customization.toggles.dots ? (
                        <DotMeter level={s.level} fill={charcoal} />
                      ) : null}
                    </div>
                  ))}
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
              style={{ color: muted }}
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
              {education.map((edu) => (
                <div key={edu.id} className="relative text-[0.88em]">
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
              {jobs.map((job) => (
                <div key={job.id} className="relative text-[0.88em]">
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
                    style={{ color: muted }}
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
  return (
    <div
      className="inline-flex max-w-full items-center gap-2 rounded-r-full py-1.5 pl-2.5 pr-5 text-white"
      style={{ backgroundColor: color }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-3 w-3" strokeWidth={2.2} />
      </span>
      <span
        className="font-bold"
        style={{
          fontSize: size,
          ...headingCapStyle(customization),
        }}
      >
        {title}
      </span>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  text,
}: {
  icon: typeof Phone;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="break-all leading-snug">{text}</span>
    </div>
  );
}

function DotMeter({ level, fill }: { level: number; fill: string }) {
  const filled = Math.max(1, Math.min(8, Math.round(((level || 3) / 5) * 8)));
  return (
    <div className="flex gap-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: i < filled ? fill : "#D4D4D4",
          }}
        />
      ))}
    </div>
  );
}
