import { Phone, Mail, Globe, MapPin } from "lucide-react";
import { photoImgStyle } from "../../../lib/photoFit";
import {
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  ReferencesBlock,
  SkillsList,
  headingCapStyle,
  type LayoutProps,
  layoutShellStyle,
} from "./shared";
import type { Customization } from "../../../types/resume";

/**
 * Richard Sanchez–style premium layout:
 * dark left rail + vertical EDUCATION/EXPERIENCE labels + orange contact band.
 * Page 2+ keeps the same template shell and only shows content pushed from page 1.
 */
export default function DesignerBlockLayout({
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
  const accent = customization.accentColor || "#F15A29";
  const sidebar = customization.sidebarBgColor || "#2B2B2B";
  const ink = customization.bodyTextColor || "#1A1A1A";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience);
  const dateFmt = customization.dateFormat || "yearOnly";
  const nameColor = customization.toggles.fullName ? accent : undefined;
  const titleColor = customization.toggles.jobTitle ? accent : undefined;
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;
  const showContact = contacts.length > 0;

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#F4F4F4")}
    >
      {/* LEFT RAIL — identity only on page 1; later pages keep the colored band */}
      <aside
        className="flex h-full shrink-0 flex-col text-white"
        style={{ width: "38%", backgroundColor: sidebar }}
      >
        {isFirstPage && (
          <>
            <div
              className="w-full shrink-0 overflow-hidden bg-neutral-600"
              style={{ aspectRatio: "1 / 1.02" }}
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

            <div className="bg-black px-5 py-5">
              <h1
                className="font-bold leading-[1.1]"
                style={{ fontSize: customization.fullNameSize, color: nameColor }}
              >
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p
                  className="mt-2 uppercase tracking-[0.22em] text-white/90"
                  style={{ fontSize: customization.titleSize, color: titleColor }}
                >
                  {personal.jobTitle}
                </p>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-6 overflow-hidden px-5 py-6">
              {skills.length > 0 && (
                <section>
                  <h2
                    className="mb-3 font-bold"
                    style={{
                      fontSize: customization.headingsSize,
                      ...headingCapStyle(customization),
                    }}
                  >
                    Skills
                  </h2>
                  <SkillsList
                    skills={skills}
                    customization={customization}
                    light
                    fill={accent}
                  />
                </section>
              )}
              {languages.length > 0 && (
                <section>
                  <h2
                    className="mb-3 font-bold"
                    style={{
                      fontSize: customization.headingsSize,
                      ...headingCapStyle(customization),
                    }}
                  >
                    Languages
                  </h2>
                  <ul className="space-y-1.5 text-[0.9em] text-white/95">
                    {languages.map((l) => (
                      <li key={l.id}>{l.name}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </>
        )}
      </aside>

      {/* RIGHT COLUMN — page 1 top sections, then experience pushed across pages */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {(hasText(personal.summary) || education.length > 0) && (
          <div className="shrink-0 space-y-5 bg-white px-6 py-6">
            {hasText(personal.summary) && (
              <section>
                <h2
                  className="mb-2 font-bold"
                  style={{
                    fontSize: customization.headingsSize,
                    ...headingCapStyle(customization),
                  }}
                >
                  Profile
                </h2>
                <RichHtml
                  html={personal.summary}
                  className="rte-content text-[0.9em] leading-relaxed"
                  style={{ color: ink }}
                />
              </section>
            )}

            {education.length > 0 && (
              <section className="flex gap-3">
                <VerticalLabel label="Education" color={ink} customization={customization} />
                <div className="min-w-0 flex-1 space-y-3.5 pt-0.5">
                  {education.map((edu) => (
                    <div key={edu.id} className="text-[0.88em]">
                      <p className="font-semibold">
                        {dateRange(edu, dateFmt)}
                        {(edu.degree || edu.field) &&
                          ` | ${[edu.degree, edu.field].filter(Boolean).join(" ")}`}
                      </p>
                      {edu.school && (
                        <p className="mt-0.5 opacity-75">{edu.school}</p>
                      )}
                      {edu.gpa && (
                        <p className="mt-0.5 opacity-70">GPA: {edu.gpa}</p>
                      )}
                      <RichHtml
                        html={edu.description}
                        className="rte-content mt-1 opacity-90"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {jobs.length > 0 && (
          <div
            className="flex shrink-0 gap-3 px-6 py-5"
            style={{ backgroundColor: "#E6E6E6" }}
          >
            <VerticalLabel label="Experience" color={ink} withRule customization={customization} />
            <div className="min-w-0 flex-1 space-y-4">
              {jobs.map((job, idx) => (
                <div key={`${job.id}-${idx}-${job.jobTitle}`} className="text-[0.88em]">
                  <p className="font-bold">
                    {[dateRange(job, dateFmt), job.jobTitle]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                  <RichHtml
                    html={job.description}
                    className="rte-content mt-1 leading-relaxed opacity-90"
                  />
                  {job.company && (
                    <p className="mt-1 font-medium opacity-70">{job.company}</p>
                  )}
                  {job.location && (
                    <p className="mt-0.5 opacity-60">{job.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showRefs && (
          <div className="shrink-0 bg-white px-6 py-4">
            <h2
              className="mb-3 font-bold"
              style={{
                fontSize: customization.headingsSize,
                ...headingCapStyle(customization),
              }}
            >
              References
            </h2>
            <ReferencesBlock
              references={references}
              includeReferences={includeReferences}
              muted="#64748B"
            />
          </div>
        )}

        {showContact && (
          <div
            className="shrink-0 px-6 py-4 text-white"
            style={{ backgroundColor: accent }}
          >
            <h2
              className="mb-3 font-bold"
              style={{
                fontSize: customization.headingsSize,
                ...headingCapStyle(customization),
              }}
            >
              Contact
            </h2>
            <div className="grid gap-2.5 text-[0.86em]">
              {contacts.map((c) => (
                <ContactRow
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
          </div>
        )}
      </div>
    </div>
  );
}

function VerticalLabel({
  label,
  color,
  withRule = false,
  customization,
}: {
  label: string;
  color: string;
  withRule?: boolean;
  customization: Customization;
}) {
  return (
    <div className="flex shrink-0 items-stretch gap-2.5">
      <div
        className="flex items-center justify-center font-bold"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: 11,
          color,
          ...headingCapStyle(customization),
        }}
      >
        {label}
      </div>
      {withRule && <div className="w-px self-stretch bg-black/80" />}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  text,
}: {
  icon: typeof Phone;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
        <Icon className="h-3 w-3" strokeWidth={2.25} />
      </span>
      <span className="break-all">{text}</span>
    </div>
  );
}
