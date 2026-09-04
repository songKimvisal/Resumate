import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { LANGUAGE_LEVEL_LABELS, type SpecialSectionKey } from "../../../types/resume";
import { resumeLanguageLevel } from "../../../lib/resumeHeadings";
import { partitionSpecialSectionOrder } from "../../../lib/sectionOrder";
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

/** Premium banking - classic header + two columns. Highly ATS-readable. */
export default function BankingCleanLayout({
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
  const accent = customization.accentColor || "#0E7490";
  const footer = customization.sidebarBgColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat;
  const isFirstPage = pageIndex === 0;

  const { main: mainOrder, sidebar: sidebarOrder } = partitionSpecialSectionOrder(
    customization.specialSectionOrder,
    customization.specialSidebarKeys,
  );

  const blocks: Partial<Record<SpecialSectionKey, ReactNode>> = {
    education: education.length > 0 && (
      <section>
        <AtsHeading title="Education" size={customization.headingsSize} ruleColor={accent} customization={customization} />
        <div className="space-y-3 text-[0.88em]">
          {education.map((edu, eduIdx) => (
            <div key={listKey(edu.id, eduIdx, "edu")}>
              <p className="font-bold">
                {[edu.degree, edu.field].filter(Boolean).join(" ") || edu.school}
              </p>
              <p style={{ color: muted }}>{edu.school}</p>
              <p className="tabular-nums" style={{ color: muted }}>{dateRange(edu, dateFmt)}</p>
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
    ),
    skills: skills.length > 0 && (
      <section>
        <AtsHeading title="Skills" size={customization.headingsSize} ruleColor={accent} customization={customization} />
        <SkillsList
          skills={skills}
          customization={customization}
          muted={muted}
          fill={accent}
        />
      </section>
    ),
    language: languages.length > 0 && (
      <section>
        <AtsHeading title="Languages" size={customization.headingsSize} ruleColor={accent} customization={customization} />
        <ul className="space-y-1 text-[0.88em]" style={{ color: muted }}>
          {languages.map((l, langIdx) => (
            <li key={listKey(l.id, langIdx, "lang")}>
              {l.name}
              {l.level >= 1 && l.level <= 5
                ? ` - ${resumeLanguageLevel(l.level - 1, customization, LANGUAGE_LEVEL_LABELS[l.level - 1])}`
                : ""}
            </li>
          ))}
        </ul>
      </section>
    ),
    experience: jobs.length > 0 && (
      <section>
        <AtsHeading title="Work Experience" size={customization.headingsSize} ruleColor={accent} customization={customization} />
        <div className="space-y-4">
          {jobs.map((job, jobIdx) => (
            <JobBlock key={listKey(job.id, jobIdx, "job")} job={job} ink={ink} muted={muted} dateFmt={dateFmt} />
          ))}
        </div>
      </section>
    ),
    references: includeReferences && references.length > 0 && (
      <section>
        <AtsHeading title="References" size={customization.headingsSize} ruleColor={accent} customization={customization} />
        <div className="grid grid-cols-2 gap-4 text-[0.85em]">
          {references.slice(0, 4).map((r, refIdx) => (
            <div key={listKey(r.id, refIdx, "ref")}>
              <p className="font-bold">{r.name}</p>
              <p style={{ color: muted }}>{[r.jobTitle, r.company].filter(Boolean).join(", ")}</p>
              {r.phone && <p style={{ color: muted }}>Phone: {r.phone}</p>}
              {r.email && <p style={{ color: muted }}>Email: {r.email}</p>}
            </div>
          ))}
        </div>
      </section>
    ),
  };
  const mainBlocks = mainOrder.map((key) => blocks[key]).filter(Boolean);
  const sidebarBlocks = sidebarOrder.map((key) => blocks[key]).filter(Boolean);

  return (
    <div
      className={`relative flex ${expandHeight ? "min-h-full" : "h-full"} w-full flex-col ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      {customization.topAccentBar && (
        <div className="absolute left-0 top-0 z-10 h-2.5 w-[18%]" style={{ backgroundColor: accent }} />
      )}

      <div className="flex flex-1 flex-col px-8 pb-5 pt-9">
        {isFirstPage && (
          <header className="mb-7 flex items-start gap-5 border-b pb-6" style={{ borderColor: ATS.line }}>
            <PhotoBox personal={personal} customization={customization} border borderColor={accent} />
            <div className="min-w-0 flex-1">
              <h1
                className="font-semibold uppercase tracking-[0.14em]"
                style={{ fontSize: customization.fullNameSize }}
              >
                {personal.fullName}
              </h1>
              {personal.jobTitle && (
                <p className="mt-1.5 font-medium tracking-wide" style={{ fontSize: customization.titleSize, color: accent }}>
                  {personal.jobTitle}
                </p>
              )}
              <div className="mt-2 h-[2px] w-10 rounded-full" style={{ backgroundColor: accent }} />
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.82em]" style={{ color: muted }}>
                {contacts.map((c, contactIdx) => (
                  <span key={listKey(c.id, contactIdx, "contact")} className="inline-flex items-center gap-1.5">
                    {c.kind === "phone" ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : c.kind === "email" ? (
                      <Mail className="h-3.5 w-3.5" />
                    ) : c.kind === "location" ? (
                      <MapPin className="h-3.5 w-3.5" />
                    ) : (
                      <Globe className="h-3.5 w-3.5" />
                    )}
                    <ContactLink item={c} />
                  </span>
                ))}
              </div>
            </div>
          </header>
        )}

        <div className={`flex ${expandHeight ? "" : "min-h-0"} flex-1 gap-8`}>
          <div className="w-[34%] shrink-0 space-y-5">
            {hasText(personal.summary) && (
              <section>
                <AtsHeading title="Professional Summary" size={customization.headingsSize} ruleColor={accent} customization={customization} />
                <RichHtml
                  html={personal.summary}
                  className="rte-content text-[0.88em] leading-relaxed text-justify"
                  style={{ color: ink }}
                />
              </section>
            )}
            {sidebarBlocks}
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            {mainBlocks}
          </div>
        </div>
      </div>

      {customization.footerBar && (
        <div className="h-2.5 w-full shrink-0" style={{ backgroundColor: footer }} />
      )}
    </div>
  );
}
