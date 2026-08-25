import { Phone, Mail, MapPin, Globe } from "lucide-react";
import {
  AtsHeading,
  JobBlock,
  RichHtml,
  hasText,
  normalizeJobs,
  personalContactLines,
  ReferencesBlock,
  EducationBlock,
  ATS,
  type LayoutProps,
  layoutShellStyle,
} from "./shared";
import { photoImgStyle } from "../../../lib/photoFit";

/** Graphic/pro sidebar - meters kept subtle; ATS text hierarchy first. */
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
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder);
  const contacts = personalContactLines(personal);
  const dateFmt = customization.dateFormat;
  const nameParts = (personal.fullName || "").trim().split(/\s+/);
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
          <>
            <div
              className="w-full shrink-0 overflow-hidden"
              style={{ aspectRatio: "1 / 1" }}
            >
              {customization.showPhoto && personal.photoUrl ? (
                <img
                  src={personal.photoUrl}
                  className="h-full w-full object-cover"
                  alt={personal.fullName || "Profile"}
                  style={photoImgStyle(personal)}
                />
              ) : (
                <div className="h-full w-full bg-slate-600" />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-hidden px-5 py-5">
              <div>
                <h1
                  className="font-bold leading-tight"
                  style={{
                    fontSize: customization.fullNameSize * 0.82,
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
                    className="mt-2 uppercase tracking-[0.14em] text-white/85"
                    style={{
                      fontSize: customization.titleSize,
                      color: titleColor,
                    }}
                  >
                    {personal.jobTitle}
                  </p>
                )}
                <div className="mt-3 h-px w-12 bg-white/70" />
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
                  <div className="space-y-2.5 text-[0.8em] text-white/90">
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

              {languages.length > 0 && (
                <section>
                  <AtsHeading
                    title="Languages"
                    color="#fff"
                    size={customization.headingsSize}
                    ruleColor="rgba(255,255,255,0.35)"
                    customization={customization}
                  />
                  <div className="space-y-2">
                    {languages.map((l) => (
                      <Meter
                        key={l.id}
                        label={l.name}
                        level={l.level}
                        fill="#94A3B8"
                        track="#0B1A2A"
                        light
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-7 py-7">
        {hasText(personal.summary) && (
          <section className="mb-5">
            <AtsHeading
              title="Professional Summary"
              size={customization.headingsSize}
              customization={customization}
            />
            <RichHtml
              html={personal.summary}
              className="rte-content mt-1 text-[0.9em] leading-relaxed"
              style={{ color: muted }}
            />
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mb-5">
            <AtsHeading
              title="Work Experience"
              size={customization.headingsSize}
              customization={customization}
            />
            <div className="mt-1 space-y-4">
              {jobs.map((job) => (
                <JobBlock
                  key={job.id}
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
              size={customization.headingsSize}
              customization={customization}
            />
            <div className="space-y-3">
              {education.map((edu) => (
                <EducationBlock
                  key={edu.id}
                  edu={edu}
                  muted={muted}
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
              size={customization.headingsSize}
              customization={customization}
            />
            {customization.skillsDisplay === "list" ||
            !customization.toggles.dots ? (
              <ul className="mt-2 space-y-1 text-[0.88em]" style={{ color: muted }}>
                {skills.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2.5">
                {skills.map((s) => (
                  <Meter
                    key={s.id}
                    label={s.name}
                    level={s.level}
                    fill={accent}
                    track="#E2E8F0"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {showRefs && (
          <section>
            <AtsHeading
              title="References"
              size={customization.headingsSize}
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

function Meter({
  label,
  level,
  fill,
  track,
  light,
}: {
  label: string;
  level: number;
  fill: string;
  track: string;
  light?: boolean;
}) {
  const pct = Math.max(0, Math.min(5, level || 3)) * 20;
  return (
    <div className="text-[0.78em]">
      <p className="mb-1" style={{ color: light ? "#fff" : undefined }}>
        {label}
      </p>
      <div className="h-1.5 w-full rounded-sm" style={{ backgroundColor: track }}>
        <div
          className="h-full rounded-sm"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
    </div>
  );
}
