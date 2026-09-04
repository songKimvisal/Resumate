import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { SpecialSectionKey } from "../../../types/resume";
import { partitionSpecialSectionOrder } from "../../../lib/sectionOrder";
import {
  RichHtml,
  hasText,
  normalizeJobs,
  personalContactLines,
  ContactLink,
  ReferencesBlock,
  SkillsList,
  AtsHeading,
  JobBlock,
  EducationBlock,
  ATS,
  headingCapStyle,
  type LayoutProps,
  layoutShellStyle,
  listKey,
  FullBleedPhoto,
} from "./shared";
import { resumeHeading } from "../../../lib/resumeHeadings";
import { contrastOn } from "../../../lib/color";

/**
 * Classic photo layout: navy identity rail + white content column.
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
  const accent = customization.accentColor || ATS.navy;
  const sidebar = customization.sidebarBgColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat || "monthYear";
  const nameColor = contrastOn(
    sidebar,
    customization.toggles.fullName ? accent : null,
  );
  const titleColor = contrastOn(
    sidebar,
    customization.toggles.jobTitle ? accent : null,
  );
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;

  const { main: mainOrder, sidebar: sidebarOrder } = partitionSpecialSectionOrder(
    customization.specialSectionOrder,
    customization.specialSidebarKeys,
  );

  const blocks: Partial<Record<SpecialSectionKey, ReactNode>> = {
    skills: skills.length > 0 && (
      <section>
        <h2
          className="mb-2.5 font-bold"
          style={{
            fontSize: customization.headingsSize,
            color: "#fff",
            ...headingCapStyle(customization),
          }}
        >
          {resumeHeading("Skills", customization)}
        </h2>
        <SkillsList
          skills={skills}
          customization={customization}
          light
          fill="#fff"
        />
      </section>
    ),
    language: languages.length > 0 && (
      <section>
        <h2
          className="mb-2.5 font-bold"
          style={{
            fontSize: customization.headingsSize,
            color: "#fff",
            ...headingCapStyle(customization),
          }}
        >
          {resumeHeading("Languages", customization)}
        </h2>
        <ul className="space-y-1.5 text-[0.85em] text-white/90">
          {languages.map((l, langIdx) => (
            <li key={listKey(l.id, langIdx, "lang")}>{l.name}</li>
          ))}
        </ul>
      </section>
    ),
    education: education.length > 0 && (
      <section>
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
    ),
    experience: jobs.length > 0 && (
      <section>
        <AtsHeading
          title="Work Experience"
          color={sidebar}
          size={customization.headingsSize}
          ruleWidth="full"
          ruleColor={ATS.line}
          customization={customization}
        />
        <div className="space-y-4">
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
    ),
    references: showRefs && (
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
    ),
  };
  const mainBlocks = mainOrder.map((key) => blocks[key]).filter(Boolean);
  const sidebarBlocks = sidebarOrder.map((key) => blocks[key]).filter(Boolean);

  return (
    <div
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <aside
        className="flex h-full shrink-0 flex-col text-white"
        style={{ width: "34%", backgroundColor: sidebar }}
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
                  style={{ fontSize: customization.fullNameSize, color: nameColor }}
                >
                  {personal.fullName}
                </h1>
                {personal.jobTitle && (
                  <p
                    className="mt-1.5 font-medium"
                    style={{ fontSize: customization.titleSize, color: titleColor }}
                  >
                    {personal.jobTitle}
                  </p>
                )}
                <div className="mt-3 h-px w-10 bg-white/40" />
              </div>

              {contacts.length > 0 && (
                <section>
                  <h2
                    className="mb-2.5 font-bold"
                    style={{
                      fontSize: customization.headingsSize,
                      color: "#fff",
                      ...headingCapStyle(customization),
                    }}
                  >
                    {resumeHeading("Contact", customization)}
                  </h2>
                  <div className="space-y-2 text-[0.8em] text-white/90">
                    {contacts.map((c, contactIdx) => (
                      <p
                        key={listKey(c.id, contactIdx, "contact")}
                        className="flex gap-2"
                      >
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

              {sidebarBlocks.length > 0 && (
                <div className="flex flex-col gap-6">{sidebarBlocks}</div>
              )}
            </div>
          </>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white px-8 py-8">
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
              className="rte-content text-[0.9em] leading-relaxed"
              style={{ color: ink }}
            />
          </section>
        )}

        {mainBlocks.length > 0 && (
          <div className="space-y-5">{mainBlocks}</div>
        )}
      </div>
    </div>
  );
}
