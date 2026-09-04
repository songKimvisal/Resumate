import { Phone, Mail, MapPin, Globe } from "lucide-react";
import type { ReactNode } from "react";
import { partitionSpecialSectionOrder } from "../../../lib/sectionOrder";
import {
  PhotoBox,
  RichHtml,
  dateRange,
  hasText,
  normalizeJobs,
  personalContactLines,
  ContactLink,
  LanguagesBlock,
  ReferencesBlock,
  SkillsList,
  AtsHeading,
  JobBlock,
  ATS,
  headingCapStyle,
  type LayoutProps,
  layoutShellStyle,
  gpaText,
  listKey,
} from "./shared";
import type { Customization, SpecialSectionKey } from "../../../types/resume";
import { resumeHeading } from "../../../lib/resumeHeadings";
import { contrastOn } from "../../../lib/color";

/**
 * Designer sidebar: navy name band + white body, photo in the right rail.
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
  const navy = customization.sidebarBgColor || ATS.navy;
  const accent = customization.accentColor || ATS.navy;
  const ink = customization.bodyTextColor || ATS.ink;
  const muted = ATS.muted;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(experience, noExperience, resume.experienceOrder, customization);
  const dateFmt = customization.dateFormat || "monthYear";
  const showRefs = includeReferences && references.length > 0;
  const isFirstPage = pageIndex === 0;
  const nameColor = contrastOn(
    navy,
    customization.toggles.fullName ? accent : null,
  );
  const titleColor = contrastOn(
    navy,
    customization.toggles.jobTitle ? accent : null,
  );

  const { main: mainOrder, sidebar: sidebarOrder } = partitionSpecialSectionOrder(
    customization.specialSectionOrder,
    customization.specialSidebarKeys,
  );

  const blocks: Partial<Record<SpecialSectionKey, ReactNode>> = {
    experience: jobs.length > 0 && (
      <section>
        <AtsHeading
          title="Work Experience"
          color={navy}
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
          color={navy}
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
    skills: isFirstPage && skills.length > 0 && (
      <section>
        <SideHeading title="Skills" size={customization.headingsSize} customization={customization} />
        <div className="mt-2.5">
          <SkillsList
            skills={skills}
            customization={customization}
            light
            fill="#fff"
          />
        </div>
      </section>
    ),
    language: isFirstPage && languages.length > 0 && (
      <section>
        <SideHeading title="Languages" size={customization.headingsSize} customization={customization} />
        <div className="mt-2.5 text-white/90">
          <LanguagesBlock languages={languages} light showLevel={false} />
        </div>
      </section>
    ),
    education: education.length > 0 && (
      <section>
        <SideHeading title="Education" size={customization.headingsSize} customization={customization} />
        <div className="mt-2.5 space-y-3 text-[0.85em]">
          {education.map((edu, eduIdx) => (
            <div key={listKey(edu.id, eduIdx, "edu")}>
              <p className="font-semibold">
                {edu.degree || edu.field || edu.school}
              </p>
              <p className="opacity-90">
                {[edu.school, dateRange(edu, dateFmt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {edu.gpa && <p className="opacity-80">{gpaText(edu.gpa, customization)}</p>}
              {hasText(edu.description) && (
                <RichHtml
                  html={edu.description}
                  className="rte-content rte-on-dark mt-1 text-[0.95em] leading-relaxed"
                  style={{ color: ATS.onDark }}
                />
              )}
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
      className={`flex ${expandHeight ? "min-h-full" : "h-full"} w-full ${expandHeight ? "overflow-visible" : "overflow-hidden"}`}
      style={layoutShellStyle(customization, pageWidthPx, pageHeightPx, expandHeight, "#FFFFFF")}
    >
      <main className="flex min-w-0 flex-1 flex-col">
        {isFirstPage && (
          <header className="px-8 py-6" style={{ backgroundColor: navy, color: nameColor }}>
            <h1
              className="font-semibold tracking-tight"
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
          </header>
        )}

        <div className="flex-1 space-y-5 overflow-hidden px-8 py-7">
          {hasText(personal.summary) && (
            <section>
              <AtsHeading
                title="Professional Summary"
                color={navy}
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

          {mainBlocks}
        </div>
      </main>

      <aside
        className="flex h-full w-[34%] shrink-0 flex-col gap-6 overflow-hidden px-6 py-7 text-white"
        style={{ backgroundColor: navy }}
      >
        {isFirstPage && (
          <>
            <div className="flex justify-center pt-1">
              <PhotoBox personal={personal} customization={customization} />
            </div>

            {contacts.length > 0 && (
              <div className="space-y-2 text-[0.82em] text-white/90">
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
                    <span className="break-all leading-snug">
                      <ContactLink item={c} />
                    </span>
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {sidebarBlocks}
      </aside>
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
        {resumeHeading(title, customization)}
      </h2>
      <div className="mt-1.5 h-px w-full bg-white/30" />
    </div>
  );
}
