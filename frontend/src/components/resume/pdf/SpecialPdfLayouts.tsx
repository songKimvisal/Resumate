import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { Resume } from "../../../types/resume";
import { resumeHeading, resumeNameFallback } from "../../../lib/resumeHeadings";
import { contrastOn } from "../../../lib/color";
import { registerPdfFonts } from "./registerPdfFonts";
import { PdfIcon, type IconKey } from "./pdfIcons";
import {
  PdfContactInline,
  PdfContactLines,
  PdfEducationBlock,
  PdfFullBleedPhoto,
  PdfHeading,
  PdfJobBlock,
  PdfLanguagesBlock,
  PdfPhotoBox,
  PdfReferencesBlock,
  PdfRich,
  PdfSkillsList,
} from "./pdfShared";
import {
  ATS,
  FONT_SIZE_RATIO,
  PX_TO_PT,
  sp,
  dateRange,
  gpaText,
  hasText,
  headerColors,
  headingCapStyle,
  normalizeJobs,
  partitionBlocks,
  pdfTheme,
  personalContactLines,
  type ContactLineItem,
  type JobLike,
  type PdfTheme,
  type SectionBlocks,
} from "./pdfTheme";

registerPdfFonts();

/* =====================================================================
 * Each function below is the PDF twin of the same-named layout in
 * ../layouts. They are written to mirror their preview counterpart
 * block for block - same section titles, same heading treatment, same
 * field order, same `specialSectionOrder` partitioning - so what the
 * builder shows is what the downloaded file contains. When you change a
 * layout in ../layouts, change its twin here.
 * ===================================================================== */

export function SpecialPdfDocument({ resume }: { resume: Resume }) {
  const t = pdfTheme(resume);
  switch (resume.customization.layoutVariant) {
    case "designerBlock":
      return <DesignerBlockPdf t={t} />;
    case "techSplit":
      return <TechSplitPdf t={t} />;
    case "bankingClean":
      return <BankingCleanPdf t={t} />;
    case "freshSidebar":
      return <FreshSidebarPdf t={t} />;
    case "navyAnalyst":
      return <NavyAnalystPdf t={t} />;
    case "ribbonFold":
      return <RibbonFoldPdf t={t} />;
    case "graphicPro":
      return <GraphicProPdf t={t} />;
    case "executiveCard":
      return <ExecutiveCardPdf t={t} />;
    case "monoTimeline":
      return <MonoTimelinePdf t={t} />;
    case "editorialClassic":
      return <EditorialClassicPdf t={t} />;
    case "compactTech":
      return <CompactTechPdf t={t} />;
    case "graduateFocus":
      return <GraduateFocusPdf t={t} />;
    case "corporateBand":
      return <CorporateBandPdf t={t} />;
    case "warmColumns":
      return <WarmColumnsPdf t={t} />;
    case "monoPill":
      return <MonoPillPdf t={t} />;
    case "cleanHeaderSplit":
      return <CleanHeaderSplitPdf t={t} />;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------------
 * shared page scaffolding
 * ------------------------------------------------------------------- */

function Sheet({
  t,
  children,
  style,
}: {
  t: PdfTheme;
  children: ReactNode;
  style?: object;
}) {
  return (
    <Document>
      <Page
        size={t.size}
        wrap
        style={{
          fontFamily: t.variants.regular,
          fontSize: t.base,
          lineHeight: t.lineHeight,
          color: t.ink,
          backgroundColor: t.paper,
          ...style,
        }}
      >
        {children}
      </Page>
    </Document>
  );
}

/** Stacks section blocks with the preview's inter-section spacing. */
function Stack({
  children,
  gap,
}: {
  children: ReactNode;
  gap: number;
}) {
  return <View style={{ gap }}>{children}</View>;
}

/** `space-y-*` between entries inside one section. */
function Entries({
  children,
  gap = 4,
}: {
  children: ReactNode;
  gap?: number;
}) {
  return <View style={{ gap: sp(gap) }}>{children}</View>;
}

/** Header name. Sets its own `lineHeight`: react-pdf resolves an inherited
 *  one against the page font size, which is too short to hold the name. */
function Name({
  t,
  color,
  size,
  leading,
  style,
  text,
}: {
  t: PdfTheme;
  color: string;
  /** px, defaults to `customization.fullNameSize` */
  size?: number;
  /** line height multiplier; defaults to the body one */
  leading?: number;
  style?: object;
  /** renders this instead of the full name - for headers that split the
   *  name across lines (graphicPro) or into first/last (executiveCard) */
  text?: string;
}) {
  return (
    <Text
      style={{
        fontFamily: t.variants.bold,
        fontSize: (size ?? t.c.fullNameSize) * FONT_PX,
        lineHeight: leading ?? t.lineHeight,
        color,
        ...style,
      }}
    >
      {text ?? (t.resume.personal.fullName || resumeNameFallback(t.c))}
    </Text>
  );
}

/** Header job title - declares `lineHeight` for the same reason as `Name`. */
function JobTitle({
  t,
  color,
  size,
  leading,
  style,
}: {
  t: PdfTheme;
  color: string;
  size?: number;
  leading?: number;
  style?: object;
}) {
  if (!t.resume.personal.jobTitle) return null;
  return (
    <Text
      style={{
        fontSize: (size ?? t.c.titleSize) * FONT_PX,
        lineHeight: leading ?? t.lineHeight,
        color,
        ...style,
      }}
    >
      {t.resume.personal.jobTitle}
    </Text>
  );
}

/** px -> pt for the Customize panel sizes, on the same scale as body text. */
const FONT_PX = FONT_SIZE_RATIO;

function h(title: string, t: PdfTheme) {
  return resumeHeading(title, t.c);
}

/* =====================================================================
 * designerBlock - navy identity rail + white content column
 * ===================================================================== */

function DesignerBlockPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const sidebar = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const nameColor = contrastOn(sidebar, t.c.toggles.fullName ? t.accent : null);
  const titleColor = contrastOn(sidebar, t.c.toggles.jobTitle ? t.accent : null);
  const railPct = 34;

  const blocks: SectionBlocks = {
    skills: skills.length > 0 && (
      <View>
        <Text
          style={{
            fontFamily: t.variants.bold,
            fontSize: t.c.headingsSize * FONT_PX,
            color: "#fff",
            marginBottom: sp(2.5),
            ...headingCapStyle(t.c),
          }}
        >
          {h("Skills", t)}
        </Text>
        <PdfSkillsList skills={skills} t={t} light fill="#fff" />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <Text
          style={{
            fontFamily: t.variants.bold,
            fontSize: t.c.headingsSize * FONT_PX,
            color: "#fff",
            marginBottom: sp(2.5),
            ...headingCapStyle(t.c),
          }}
        >
          {h("Languages", t)}
        </Text>
        <PdfLanguagesBlock
          languages={languages}
          t={t}
          color={ATS.onDark}
          showLevel={false}
        />
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PdfHeading
          title="Education"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <Entries gap={3}>
          {education.map((edu) => (
            <PdfEducationBlock key={edu.id} edu={edu} t={t} />
          ))}
        </Entries>
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading
          title="Work Experience"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading
          title="References"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <PdfReferencesBlock
          references={references}
          includeReferences={includeReferences}
          t={t}
        />
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t}>
      {/* rail band repeats down every page, as the preview's full-height aside does */}
      <View
        fixed
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${railPct}%`,
          backgroundColor: sidebar,
        }}
      />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: `${railPct}%` }}>
          <PdfFullBleedPhoto
            t={t}
            height={150}
            fill={sidebar}
            railWidth={190}
          />
          <View style={{ paddingHorizontal: 18, paddingVertical: 18, gap: 18 }}>
            <View>
              <Name t={t} color={nameColor} leading={1.15} />
              <JobTitle
                t={t}
                color={titleColor}
                style={{ marginTop: sp(1.5) }}
              />
              <View
                style={{
                  marginTop: sp(3),
                  height: PX_TO_PT,
                  width: sp(10),
                  backgroundColor: "rgba(255,255,255,0.4)",
                }}
              />
            </View>
            {contacts.length > 0 && (
              <View>
                <Text
                  style={{
                    fontFamily: t.variants.bold,
                    fontSize: t.c.headingsSize * FONT_PX,
                    color: "#fff",
                    marginBottom: sp(2.5),
                    ...headingCapStyle(t.c),
                  }}
                >
                  {h("Contact", t)}
                </Text>
                <PdfContactLines contacts={contacts} t={t} color={ATS.onDark} />
              </View>
            )}
            {side.length > 0 && <Stack gap={18}>{side}</Stack>}
          </View>
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 0,
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
        >
          {hasText(personal.summary) && (
            <View style={{ marginBottom: 15 }}>
              <PdfHeading
                title="Professional Summary"
                t={t}
                color={sidebar}
                ruleWidth="full"
                ruleColor={ATS.line}
              />
              <PdfRich html={personal.summary} t={t} size={t.em(0.9)} />
            </View>
          )}
          {main.length > 0 && <Stack gap={15}>{main}</Stack>}
        </View>
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * techSplit - navy name band + white body, photo in the right rail
 * ===================================================================== */

function TechSplitPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const navy = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const nameColor = contrastOn(navy, t.c.toggles.fullName ? t.accent : null);
  const titleColor = contrastOn(navy, t.c.toggles.jobTitle ? t.accent : null);

  const blocks: SectionBlocks = {
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading
          title="Work Experience"
          t={t}
          color={navy}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading
          title="References"
          t={t}
          color={navy}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <PdfReferencesBlock
          references={references}
          includeReferences={includeReferences}
          t={t}
        />
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        <TechSideHeading title="Skills" t={t} />
        <View style={{ marginTop: sp(2.5) }}>
          <PdfSkillsList skills={skills} t={t} light fill="#fff" />
        </View>
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <TechSideHeading title="Languages" t={t} />
        <View style={{ marginTop: sp(2.5) }}>
          <PdfLanguagesBlock
            languages={languages}
            t={t}
            color={ATS.onDark}
            showLevel={false}
          />
        </View>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <TechSideHeading title="Education" t={t} />
        <View style={{ marginTop: sp(2.5), gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold, color: "#fff" }}>
                {edu.degree || edu.field || edu.school}
              </Text>
              <Text style={{ color: ATS.onDark }}>
                {[edu.school, dateRange(edu, t.dateFmt, t.c)]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: ATS.onDark }}>
                  {gpaText(edu.gpa, t.c)}
                </Text>
              ) : null}
              <PdfRich
                html={edu.description}
                t={t}
                color={ATS.onDark}
                size={t.em(0.85) * 0.95}
              />
            </View>
          ))}
        </View>
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ flexDirection: "row" }}>
      <View style={{ flexGrow: 1, flexBasis: 0 }}>
        <View
          style={{
            backgroundColor: navy,
            paddingHorizontal: 24,
            paddingVertical: 18,
          }}
        >
          <Name t={t} color={nameColor} />
          <JobTitle
            t={t}
            color={titleColor}
            style={{ marginTop: sp(1.5) }}
          />
        </View>
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 21,
            gap: 15,
          }}
        >
          {hasText(personal.summary) && (
            <View>
              <PdfHeading
                title="Professional Summary"
                t={t}
                color={navy}
                ruleWidth="full"
                ruleColor={ATS.line}
              />
              <PdfRich html={personal.summary} t={t} size={t.em(0.9)} />
            </View>
          )}
          {main}
        </View>
      </View>

      <View
        style={{
          width: "34%",
          backgroundColor: navy,
          paddingHorizontal: 18,
          paddingVertical: 21,
          gap: 18,
        }}
      >
        <PdfPhotoBox t={t} align="center" />
        {contacts.length > 0 && (
          <PdfContactLines
            contacts={contacts}
            t={t}
            color={ATS.onDark}
            size={t.em(0.82)}
          />
        )}
        {side}
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * bankingClean - classic header + two columns
 * ===================================================================== */

function BankingCleanPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.c.accentColor || "#0E7490";
  const footer = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );

  const blocks: SectionBlocks = {
    education: education.length > 0 && (
      <View>
        <PdfHeading title="Education" t={t} ruleColor={accent} />
        <View style={{ gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.88) }}>
              <Text style={{ fontFamily: t.variants.bold }}>
                {[edu.degree, edu.field].filter(Boolean).join(" ") || edu.school}
              </Text>
              <Text style={{ color: t.muted }}>{edu.school}</Text>
              <Text style={{ color: t.muted }}>
                {dateRange(edu, t.dateFmt, t.c)}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: t.muted }}>
                  {gpaText(edu.gpa, t.c)}
                </Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.88)} />
            </View>
          ))}
        </View>
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        <PdfHeading title="Skills" t={t} ruleColor={accent} />
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading title="Languages" t={t} ruleColor={accent} />
        <PdfLanguagesBlock languages={languages} t={t} />
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading title="Work Experience" t={t} ruleColor={accent} />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading title="References" t={t} ruleColor={accent} />
        <PdfReferencesBlock
          references={references}
          includeReferences={includeReferences}
          t={t}
          max={4}
        />
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet
      t={t}
      style={{ paddingHorizontal: 24, paddingTop: 27, paddingBottom: 15 }}
    >
      {t.c.topAccentBar && (
        <View
          fixed
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 10 * PX_TO_PT,
            width: "18%",
            backgroundColor: accent,
          }}
        />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 15,
          marginBottom: 21,
          paddingBottom: 18,
          borderBottomWidth: 0.5,
          borderBottomColor: ATS.line,
          borderBottomStyle: "solid",
        }}
      >
        <PdfPhotoBox t={t} border borderColor={accent} />
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <Name
            t={t}
            color={t.ink}
            style={{ textTransform: "uppercase", letterSpacing: 1.4 }}
          />
          <JobTitle
            t={t}
            color={accent}
            style={{ marginTop: sp(1.5), letterSpacing: 0.3 }}
          />
          <View
            style={{
              marginTop: sp(2),
              height: 2 * PX_TO_PT,
              width: sp(10),
              borderRadius: PX_TO_PT,
              backgroundColor: accent,
            }}
          />
          <View style={{ marginTop: sp(3) }}>
            <PdfContactLines
              contacts={contacts}
              t={t}
              color={t.muted}
              size={t.em(0.82)}
            />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 24 }}>
        <View style={{ width: "34%", gap: 15 }}>
          {hasText(personal.summary) && (
            <View>
              <PdfHeading
                title="Professional Summary"
                t={t}
                ruleColor={accent}
              />
              <PdfRich
                html={personal.summary}
                t={t}
                size={t.em(0.88)}
                align="justify"
              />
            </View>
          )}
          {side}
        </View>
        <View style={{ flexGrow: 1, flexBasis: 0, gap: 15 }}>{main}</View>
      </View>

      {t.c.footerBar && (
        <View
          fixed
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 10 * PX_TO_PT,
            backgroundColor: footer,
          }}
        />
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------------------
 * pieces shared by several layouts
 * ------------------------------------------------------------------- */

/** Experience list with the preview's left rule + accent dot per entry. */
function TimelineJobs({ t, jobs }: { t: PdfTheme; jobs: JobLike[] }) {
  return (
    <View
      style={{
        gap: sp(4),
        paddingLeft: sp(4),
        borderLeftWidth: 2 * PX_TO_PT,
        borderLeftColor: ATS.line,
        borderLeftStyle: "solid",
      }}
    >
      {jobs.map((job) => (
        <View key={job.id} style={{ position: "relative" }}>
          <View
            style={{
              position: "absolute",
              left: -21.6 * PX_TO_PT,
              top: sp(1.5),
              width: sp(2.5),
              height: sp(2.5),
              borderRadius: sp(1.25),
              backgroundColor: t.accent,
            }}
          />
          <PdfJobBlock job={job} t={t} titleFirst={false} />
        </View>
      ))}
    </View>
  );
}

/** Education entries as the dark sidebars render them: school in caps,
 *  degree - field, dates, GPA, notes. */
function DarkEducation({ t }: { t: PdfTheme }) {
  const size = t.em(0.8);
  return (
    <View style={{ gap: sp(3) }}>
      {t.resume.education.map((edu) => (
        <View key={edu.id} style={{ fontSize: size }}>
          <Text
            style={{
              fontFamily: t.variants.bold,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            {edu.school}
          </Text>
          {[edu.degree, edu.field].filter(Boolean).length > 0 ? (
            <Text style={{ color: ATS.onDark }}>
              {[edu.degree, edu.field].filter(Boolean).join(" - ")}
            </Text>
          ) : null}
          <Text style={{ color: ATS.onDark }}>
            {dateRange(edu, t.dateFmt, t.c)}
          </Text>
          {edu.gpa ? (
            <Text style={{ color: ATS.onDark }}>{gpaText(edu.gpa, t.c)}</Text>
          ) : null}
          <PdfRich
            html={edu.description}
            t={t}
            color={ATS.onDark}
            size={size * 0.95}
          />
        </View>
      ))}
    </View>
  );
}

/** References as the two-column previews render them: company / title. */
function SlashReferences({ t, max = 4 }: { t: PdfTheme; max?: number }) {
  const { references, includeReferences } = t.resume;
  if (!includeReferences || references.length === 0) return null;
  const size = t.em(0.85);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp(4) }}>
      {references.slice(0, max).map((r) => (
        <View key={r.id} style={{ width: "47%", fontSize: size }}>
          <Text style={{ fontFamily: t.variants.bold }}>{r.name}</Text>
          <Text style={{ color: t.muted }}>
            {[r.company, r.jobTitle].filter(Boolean).join(" / ")}
          </Text>
          {r.phone ? <Text style={{ color: t.muted }}>{r.phone}</Text> : null}
          {r.email ? <Text style={{ color: t.muted }}>{r.email}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** techSplit's rail heading: white label over a hairline. */
function TechSideHeading({ title, t }: { title: string; t: PdfTheme }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: t.variants.bold,
          fontSize: t.c.headingsSize * FONT_PX,
          color: "#fff",
          ...headingCapStyle(t.c),
        }}
      >
        {h(title, t)}
      </Text>
      <View
        style={{
          marginTop: sp(1.5),
          height: PX_TO_PT,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.3)",
        }}
      />
    </View>
  );
}

/** graduateFocus's white card: rounded, hairline ring, generous padding. */
function SoftCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 8 * PX_TO_PT,
        borderWidth: 0.5,
        borderColor: "rgba(226,232,240,0.8)",
        borderStyle: "solid",
        paddingHorizontal: 18,
        paddingVertical: 12,
      }}
    >
      {children}
    </View>
  );
}

/** monoPill's capsule heading: icon badge + label, right-rounded. Degrades
 *  to the shared heading when headingBorder asks for line/underline. */
function PillHeading({
  title,
  icon,
  color,
  t,
}: {
  title: string;
  icon: IconKey;
  color: string;
  t: PdfTheme;
}) {
  const border = t.c.headingBorder;
  if (border === "line" || border === "underline") {
    return (
      <PdfHeading
        title={title}
        t={t}
        color={color}
        ruleColor={color}
        ruleWidth="full"
        marginBottom={0}
      />
    );
  }
  const outline = border === "outline";
  const fontSize = t.c.headingsSize * FONT_PX;
  const ink = outline ? color : contrastOn(color);
  return (
    <View style={{ flexDirection: "row" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: sp(2),
          paddingLeft: sp(2.5),
          paddingRight: sp(5),
          paddingVertical: sp(1.5),
          borderTopRightRadius: 999,
          borderBottomRightRadius: 999,
          ...(outline
            ? {
                borderWidth: 1.5 * PX_TO_PT,
                borderColor: color,
                borderStyle: "solid" as const,
              }
            : { backgroundColor: color }),
        }}
      >
        <PdfIcon icon={icon} size={fontSize} color={ink} />
        <Text
          style={{
            fontFamily: t.variants.bold,
            fontSize,
            color: ink,
            ...headingCapStyle(t.c),
          }}
        >
          {h(title, t)}
        </Text>
      </View>
    </View>
  );
}

/** Entries hung off a vertical spine, as monoPill and cleanHeaderSplit draw
 *  them. `Bullet` marks each entry against the rule. */
function Spine({
  children,
  color,
  marginTop = 3,
}: {
  children: ReactNode;
  color: string;
  marginTop?: number;
}) {
  return (
    <View
      style={{
        marginTop: sp(marginTop),
        paddingLeft: sp(4),
        gap: sp(4),
        borderLeftWidth: 0.5,
        borderLeftColor: color,
        borderLeftStyle: "solid",
      }}
    >
      {children}
    </View>
  );
}

function Bullet({ color }: { color: string }) {
  return (
    <View
      style={{
        position: "absolute",
        left: -sp(4),
        top: sp(1.5),
        width: sp(2),
        height: sp(2),
        borderRadius: sp(1),
        backgroundColor: color,
      }}
    />
  );
}

/** cleanHeaderSplit's heading: a bold label one point above the others. */
function SplitTitle({
  title,
  color,
  t,
}: {
  title: string;
  color: string;
  t: PdfTheme;
}) {
  return (
    <Text
      style={{
        fontFamily: t.variants.bold,
        fontSize: (t.c.headingsSize + 1) * FONT_PX,
        color,
        marginBottom: sp(2.5),
        ...headingCapStyle(t.c),
      }}
    >
      {h(title, t)}
    </Text>
  );
}

/** The accent tick the header blocks draw under name + title. */
function HeaderTick({
  t,
  width = 44,
  marginTop = 12,
  color,
}: {
  t: PdfTheme;
  width?: number;
  marginTop?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        marginTop: marginTop * PX_TO_PT,
        height: 2 * PX_TO_PT,
        width: width * PX_TO_PT,
        borderRadius: PX_TO_PT,
        backgroundColor: color ?? t.accent,
      }}
    />
  );
}

/* =====================================================================
 * freshSidebar - main narrative + rounded navy sidebar
 * ===================================================================== */

function FreshSidebarPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages } = t.resume;
  const sidebar = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const { name: nameColor, title: titleColor } = headerColors(t, "#FFFFFF");
  const mainRule = t.c.toggles.headings ? t.accent : ATS.line;

  const blocks: SectionBlocks = {
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading title="Work Experience" t={t} ruleColor={mainRule} />
        <TimelineJobs t={t} jobs={jobs} />
      </View>
    ),
    references: t.resume.includeReferences &&
      t.resume.references.length > 0 && (
        <View>
          <PdfHeading title="References" t={t} ruleColor={mainRule} />
          <SlashReferences t={t} />
        </View>
      ),
    education: education.length > 0 && (
      <View>
        <PdfHeading
          title="Education"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <DarkEducation t={t} />
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        <PdfHeading
          title="Skills"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <PdfSkillsList skills={skills} t={t} light />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading
          title="Languages"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <PdfLanguagesBlock languages={languages} t={t} color={ATS.onDark} />
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ flexDirection: "row", padding: 18, gap: 15 }}>
      <View style={{ flexGrow: 1, flexBasis: 0, paddingTop: 3 }}>
        <View style={{ marginBottom: 18 }}>
          <Name
            t={t}
            color={nameColor}
            style={{ textTransform: "uppercase", letterSpacing: 1.2 }}
          />
          <JobTitle
            t={t}
            color={titleColor}
            style={{
              marginTop: sp(1.5),
              textTransform: "uppercase",
              letterSpacing: 2.2,
            }}
          />
          <HeaderTick t={t} />
        </View>

        {hasText(personal.summary) && (
          <View style={{ marginBottom: 15 }}>
            <PdfHeading
              title="Professional Summary"
              t={t}
              ruleColor={mainRule}
            />
            <PdfRich html={personal.summary} t={t} size={t.em(0.9)} />
          </View>
        )}
        {main.length > 0 && <Stack gap={15}>{main}</Stack>}
      </View>

      <View
        style={{
          width: "34%",
          backgroundColor: sidebar,
          paddingHorizontal: 15,
          paddingVertical: 18,
          gap: 18,
          borderTopLeftRadius: 18 * PX_TO_PT,
          borderBottomLeftRadius: 18 * PX_TO_PT,
          borderTopRightRadius: 6 * PX_TO_PT,
          borderBottomRightRadius: 6 * PX_TO_PT,
        }}
      >
        <PdfPhotoBox t={t} align="center" borderColor="#fff" />
        {contacts.length > 0 && (
          <View>
            <PdfHeading
              title="Contact"
              t={t}
              color="#fff"
              ruleColor="rgba(255,255,255,0.4)"
            />
            <PdfContactLines contacts={contacts} t={t} color={ATS.onDark} />
          </View>
        )}
        {side}
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * navyAnalyst - navy left sidebar + analyst main column
 * ===================================================================== */

function NavyAnalystPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages } = t.resume;
  const sidebar = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const { name: nameColor, title: titleColor } = headerColors(t, "#FFFFFF");
  const mainRule = t.c.toggles.headings ? t.accent : ATS.line;

  const blocks: SectionBlocks = {
    education: education.length > 0 && (
      <View>
        <PdfHeading
          title="Education"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <DarkEducation t={t} />
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        <PdfHeading
          title="Skills"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <PdfSkillsList skills={skills} t={t} light />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading
          title="Languages"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <PdfLanguagesBlock languages={languages} t={t} color={ATS.onDark} />
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading title="Work Experience" t={t} ruleColor={mainRule} />
        <TimelineJobs t={t} jobs={jobs} />
      </View>
    ),
    references: t.resume.includeReferences &&
      t.resume.references.length > 0 && (
        <View>
          <PdfHeading title="References" t={t} ruleColor={mainRule} />
          <SlashReferences t={t} />
        </View>
      ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ flexDirection: "row" }}>
      <View
        style={{
          width: "32%",
          backgroundColor: sidebar,
          paddingHorizontal: 18,
          paddingVertical: 24,
          gap: 18,
        }}
      >
        <PdfPhotoBox t={t} align="center" borderColor="#fff" />
        {contacts.length > 0 && (
          <View>
            <PdfHeading
              title="Contact"
              t={t}
              color="#fff"
              ruleColor="rgba(255,255,255,0.4)"
            />
            <PdfContactLines contacts={contacts} t={t} color={ATS.onDark} />
          </View>
        )}
        {side}
      </View>

      <View
        style={{
          flexGrow: 1,
          flexBasis: 0,
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
      >
        <View style={{ marginBottom: 18 }}>
          <Name
            t={t}
            color={nameColor}
            style={{ textTransform: "uppercase", letterSpacing: 1.2 }}
          />
          <JobTitle
            t={t}
            color={titleColor}
            style={{
              marginTop: sp(1.5),
              textTransform: "uppercase",
              letterSpacing: 2.2,
            }}
          />
          <HeaderTick t={t} width={48} marginTop={14} />
        </View>

        {hasText(personal.summary) && (
          <View style={{ marginBottom: 15 }}>
            <PdfHeading
              title="Professional Summary"
              t={t}
              ruleColor={mainRule}
            />
            <PdfRich
              html={personal.summary}
              t={t}
              size={t.em(0.9)}
              align="justify"
            />
          </View>
        )}
        {main.length > 0 && <Stack gap={15}>{main}</Stack>}
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * ribbonFold - charcoal sidebar with About + Contact, ATS main column
 * ===================================================================== */

function RibbonFoldPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages } = t.resume;
  const sidebar = t.c.sidebarBgColor || "#475569";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const { name: nameColor, title: titleColor } = headerColors(t, "#FFFFFF");

  const blocks: SectionBlocks = {
    skills: skills.length > 0 && (
      <View>
        <PdfHeading
          title="Skills"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <PdfSkillsList skills={skills} t={t} light />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading
          title="Languages"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.4)"
        />
        <PdfLanguagesBlock languages={languages} t={t} color={ATS.onDark} />
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PdfHeading title="Education" t={t} ruleColor={t.accent} />
        <Entries gap={3}>
          {education.map((edu) => (
            <PdfEducationBlock key={edu.id} edu={edu} t={t} />
          ))}
        </Entries>
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading title="Work Experience" t={t} ruleColor={t.accent} />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: t.resume.includeReferences &&
      t.resume.references.length > 0 && (
        <View>
          <PdfHeading title="References" t={t} ruleColor={t.accent} />
          <PdfReferencesBlock
            references={t.resume.references}
            includeReferences={t.resume.includeReferences}
            t={t}
          />
        </View>
      ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ flexDirection: "row" }}>
      <View style={{ width: "33%", backgroundColor: sidebar }}>
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 12,
            paddingTop: 21,
            paddingBottom: 12,
          }}
        >
          <PdfPhotoBox t={t} borderColor="#fff" />
        </View>
        <View
          style={{
            paddingHorizontal: 15,
            paddingBottom: 18,
            gap: 15,
          }}
        >
          {hasText(personal.summary) && (
            <View>
              <PdfHeading
                title="About"
                t={t}
                color="#fff"
                ruleColor="rgba(255,255,255,0.4)"
              />
              <PdfRich
                html={personal.summary}
                t={t}
                color={ATS.onDark}
                size={t.em(0.82)}
              />
            </View>
          )}
          {side}
          {contacts.length > 0 && (
            <View>
              <PdfHeading
                title="Contact"
                t={t}
                color="#fff"
                ruleColor="rgba(255,255,255,0.4)"
              />
              <PdfContactLines contacts={contacts} t={t} color={ATS.onDark} />
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          flexGrow: 1,
          flexBasis: 0,
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
      >
        <View style={{ marginBottom: 21 }}>
          <Name t={t} color={nameColor} leading={1} style={{ letterSpacing: -0.3 }} />
          <JobTitle
            t={t}
            color={titleColor}
            style={{
              marginTop: sp(2.5),
              textTransform: "uppercase",
              letterSpacing: 2.2,
            }}
          />
          <HeaderTick t={t} width={44} marginTop={16} />
        </View>
        {main.length > 0 && <Stack gap={15}>{main}</Stack>}
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * graphicPro - navy rail with stacked name, white body
 * ===================================================================== */

function GraphicProPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const sidebar = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const nameParts = (personal.fullName || "").trim().split(/\s+/);
  const nameColor = contrastOn(sidebar, t.c.toggles.fullName ? t.accent : null);
  const titleColor = contrastOn(sidebar, t.c.toggles.jobTitle ? t.accent : null);
  const railPct = 33;

  const blocks: SectionBlocks = {
    language: languages.length > 0 && (
      <View>
        <PdfHeading
          title="Languages"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.35)"
        />
        <PdfLanguagesBlock
          languages={languages}
          t={t}
          color={ATS.onDark}
          showLevel={false}
        />
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading
          title="Work Experience"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PdfHeading
          title="Education"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <Entries gap={3}>
          {education.map((edu) => (
            <PdfEducationBlock key={edu.id} edu={edu} t={t} />
          ))}
        </Entries>
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        <PdfHeading
          title="Skills"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <PdfSkillsList skills={skills} t={t} color={t.ink} fill={sidebar} />
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading
          title="References"
          t={t}
          color={sidebar}
          ruleWidth="full"
          ruleColor={ATS.line}
        />
        <PdfReferencesBlock
          references={references}
          includeReferences={includeReferences}
          t={t}
        />
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t}>
      <View
        fixed
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${railPct}%`,
          backgroundColor: sidebar,
        }}
      />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: `${railPct}%` }}>
          <PdfFullBleedPhoto t={t} height={150} fill={sidebar} railWidth={185} />
          <View style={{ paddingHorizontal: 18, paddingVertical: 18, gap: 18 }}>
            <View>
              {/* the preview breaks the name one word per line */}
              {nameParts.map((part, i) => (
                <Name
                  key={i}
                  t={t}
                  color={nameColor}
                  leading={1.15}
                  size={t.c.fullNameSize * 0.86}
                  style={{ letterSpacing: -0.3 }}
                  text={part}
                />
              ))}
              <JobTitle
                t={t}
                color={titleColor}
                style={{ marginTop: sp(1.5) }}
              />
              <View
                style={{
                  marginTop: sp(3),
                  height: PX_TO_PT,
                  width: sp(10),
                  backgroundColor: "rgba(255,255,255,0.4)",
                }}
              />
            </View>
            {contacts.length > 0 && (
              <View>
                <PdfHeading
                  title="Contact"
                  t={t}
                  color="#fff"
                  ruleColor="rgba(255,255,255,0.35)"
                />
                <PdfContactLines contacts={contacts} t={t} color={ATS.onDark} />
              </View>
            )}
            {side}
          </View>
        </View>

        <View
          style={{
            flexGrow: 1,
            flexBasis: 0,
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
        >
          {hasText(personal.summary) && (
            <View style={{ marginBottom: 15 }}>
              <PdfHeading
                title="Professional Summary"
                t={t}
                color={sidebar}
                ruleWidth="full"
                ruleColor={ATS.line}
              />
              <PdfRich html={personal.summary} t={t} size={t.em(0.9)} />
            </View>
          )}
          {main.length > 0 && <Stack gap={15}>{main}</Stack>}
        </View>
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * executiveCard - navy card rail, first/last name split header
 * ===================================================================== */

function ExecutiveCardPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const navy = t.c.sidebarBgColor || ATS.navy;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const nameParts = (personal.fullName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const nameColor = contrastOn(
    "#FFFFFF",
    t.c.toggles.fullName ? t.accent : navy,
  );
  const titleColor = contrastOn(
    "#FFFFFF",
    t.c.toggles.jobTitle ? t.accent : t.muted,
  );

  const blocks: SectionBlocks = {
    skills: skills.length > 0 && (
      <View>
        <PdfHeading
          title="Skills"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.35)"
        />
        <PdfSkillsList skills={skills} t={t} light />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading
          title="Languages"
          t={t}
          color="#fff"
          ruleColor="rgba(255,255,255,0.35)"
        />
        <PdfLanguagesBlock
          languages={languages}
          t={t}
          color={ATS.onDark}
          showLevel={false}
        />
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading
          title="Work Experience"
          t={t}
          color={navy}
          ruleColor={t.accent}
        />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PdfHeading
          title="Education"
          t={t}
          color={navy}
          ruleColor={t.accent}
        />
        <Entries gap={3}>
          {education.map((edu) => (
            <PdfEducationBlock key={edu.id} edu={edu} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading
          title="References"
          t={t}
          color={navy}
          ruleColor={t.accent}
        />
        <SlashReferences t={t} />
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ flexDirection: "row" }}>
      {/* navy photo card tucked into the top-right corner */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "26%",
          height: "24%",
          backgroundColor: navy,
          borderBottomLeftRadius: 40 * PX_TO_PT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PdfPhotoBox t={t} borderColor="#fff" />
      </View>

      <View
        style={{
          width: "33%",
          marginTop: "14%",
          backgroundColor: navy,
          borderTopRightRadius: 56 * PX_TO_PT,
          paddingHorizontal: 15,
          paddingTop: 30,
          paddingBottom: 18,
          gap: 12,
        }}
      >
        {hasText(personal.summary) && (
          <View>
            <PdfHeading
              title="About"
              t={t}
              color="#fff"
              ruleColor="rgba(255,255,255,0.35)"
            />
            <PdfRich
              html={personal.summary}
              t={t}
              color={ATS.onDark}
              size={t.em(0.78)}
            />
          </View>
        )}
        {contacts.length > 0 && (
          <View>
            <PdfHeading
              title="Contact"
              t={t}
              color="#fff"
              ruleColor="rgba(255,255,255,0.35)"
            />
            <PdfContactLines
              contacts={contacts}
              t={t}
              color={ATS.onDark}
              size={t.em(0.78)}
            />
          </View>
        )}
        {side}
      </View>

      <View
        style={{
          flexGrow: 1,
          flexBasis: 0,
          paddingHorizontal: 21,
          paddingTop: 24,
          paddingBottom: 18,
        }}
      >
        <View style={{ marginBottom: 21, paddingRight: "28%" }}>
          <Text
            style={{
              fontSize: t.c.titleSize * FONT_PX,
              lineHeight: t.lineHeight,
              color: nameColor,
              textTransform: "uppercase",
              letterSpacing: 2.8,
            }}
          >
            {firstName}
          </Text>
          <Name
            t={t}
            color={nameColor}
            leading={1}
            text={lastName || firstName}
            style={{
              marginTop: sp(1),
              textTransform: "uppercase",
              letterSpacing: -0.3,
            }}
          />
          <JobTitle
            t={t}
            color={titleColor}
            size={t.c.fontSize}
            style={{ marginTop: sp(2.5), letterSpacing: 0.3 }}
          />
          <HeaderTick t={t} width={40} marginTop={16} />
        </View>
        {main.length > 0 && <Stack gap={15}>{main}</Stack>}
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * monoTimeline - single reading column, accent spine
 * ===================================================================== */

function MonoTimelinePdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.accent;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );

  const blocks: SectionBlocks = {
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading
          title="Work Experience"
          t={t}
          color={accent}
          ruleColor={accent}
        />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PdfHeading
          title="Education"
          t={t}
          color={accent}
          ruleColor={ATS.line}
        />
        <View style={{ gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.9) }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: sp(3),
                }}
              >
                <Text style={{ fontFamily: t.variants.bold, flexShrink: 1 }}>
                  {[edu.degree, edu.field].filter(Boolean).join(" - ") ||
                    edu.school}
                </Text>
                <Text style={{ color: t.muted, flexShrink: 0 }}>
                  {dateRange(edu, t.dateFmt, t.c)}
                </Text>
              </View>
              <Text style={{ color: t.muted }}>{edu.school}</Text>
              {edu.gpa ? (
                <Text style={{ color: t.muted }}>{gpaText(edu.gpa, t.c)}</Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.9)} />
            </View>
          ))}
        </View>
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        <PdfHeading title="Skills" t={t} color={accent} ruleColor={ATS.line} />
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading
          title="Languages"
          t={t}
          color={accent}
          ruleColor={ATS.line}
        />
        <Text style={{ fontSize: t.em(0.9), color: t.muted }}>
          {languages.map((l) => l.name).join(" · ")}
        </Text>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading
          title="References"
          t={t}
          color={accent}
          ruleColor={ATS.line}
        />
        <PdfReferencesBlock
          references={references}
          includeReferences={includeReferences}
          t={t}
          max={4}
        />
      </View>
    ),
  };
  // single column: the sidebar list simply continues after the main list
  const { main, sidebar: side } = partitionBlocks(t, blocks);
  const ordered = [...main, ...side];

  return (
    <Sheet t={t} style={{ paddingHorizontal: 30, paddingVertical: 27 }}>
      <View
        fixed
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5 * PX_TO_PT,
          backgroundColor: accent,
        }}
      />
      <View
        style={{
          marginBottom: 21,
          paddingBottom: 18,
          borderBottomWidth: 0.5,
          borderBottomColor: ATS.line,
          borderBottomStyle: "solid",
        }}
      >
        <Name
          t={t}
          color={t.ink}
          style={{ textTransform: "uppercase", letterSpacing: 1.2 }}
        />
        <JobTitle
          t={t}
          color={accent}
          style={{
            marginTop: sp(1.5),
            fontFamily: t.variants.bold,
            textTransform: "uppercase",
            letterSpacing: 1.6,
          }}
        />
        <View style={{ marginTop: sp(3) }}>
          <PdfContactInline contacts={contacts} t={t} size={t.em(0.85)} />
        </View>
      </View>

      <Stack gap={15}>
        {hasText(personal.summary) && (
          <View>
            <PdfHeading
              title="Professional Summary"
              t={t}
              color={accent}
              ruleColor={accent}
            />
            <PdfRich html={personal.summary} t={t} size={t.em(0.92)} />
          </View>
        )}
        {ordered}
      </Stack>
    </Sheet>
  );
}

/* =====================================================================
 * editorialClassic - centered editorial header, full-width rules
 * ===================================================================== */

function EditorialClassicPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.c.accentColor || "#0F172A";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const head = (title: string) => (
    <PdfHeading
      title={title}
      t={t}
      color={accent}
      ruleWidth="full"
      ruleColor={ATS.line}
    />
  );

  const blocks: SectionBlocks = {
    experience: jobs.length > 0 && (
      <View>
        {head("Work Experience")}
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        {head("Education")}
        <View style={{ gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.88) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{edu.school}</Text>
              <Text style={{ color: t.muted }}>
                {[edu.degree, edu.field].filter(Boolean).join(" - ")}
              </Text>
              <Text style={{ color: t.muted }}>
                {dateRange(edu, t.dateFmt, t.c)}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: t.muted }}>{gpaText(edu.gpa, t.c)}</Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.88)} />
            </View>
          ))}
        </View>
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        {head("Skills")}
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        {head("Languages")}
        <Text style={{ fontSize: t.em(0.88), color: t.muted }}>
          {languages.map((l) => l.name).join(" · ")}
        </Text>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        {head("References")}
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: sp(4) }}
        >
          {references.slice(0, 4).map((r) => (
            <View key={r.id} style={{ width: "47%", fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{r.name}</Text>
              <Text style={{ color: t.muted }}>
                {[r.jobTitle, r.company].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ))}
        </View>
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ paddingHorizontal: 36, paddingVertical: 30 }}>
      <View style={{ marginBottom: 24, alignItems: "center" }}>
        <Name t={t} color={t.ink} style={{ letterSpacing: -0.3 }} />
        <JobTitle
          t={t}
          color={accent}
          style={{ marginTop: sp(1.5) }}
        />
        <View style={{ marginTop: sp(3), alignItems: "center" }}>
          <PdfContactInline contacts={contacts} t={t} size={t.em(0.8)} />
        </View>
        <View
          style={{
            marginTop: 15,
            height: PX_TO_PT,
            width: "100%",
            backgroundColor: ATS.line,
          }}
        />
      </View>

      <Stack gap={15}>
        {hasText(personal.summary) && (
          <View>
            {head("Professional Summary")}
            <PdfRich
              html={personal.summary}
              t={t}
              size={t.em(0.9)}
              align="center"
            />
          </View>
        )}
        {[...main, ...side]}
      </Stack>
    </Sheet>
  );
}

/* =====================================================================
 * compactTech - full-width accent band, tinted skills rail
 * ===================================================================== */

function CompactTechPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.c.accentColor || "#1D4ED8";
  const headerInk = contrastOn(accent);
  const railBg = t.c.sidebarBgColor || "#F1F5F9";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );

  const blocks: SectionBlocks = {
    skills: skills.length > 0 && (
      <View>
        <PdfHeading title="Technical Skills" t={t} color={accent} />
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PdfHeading title="Languages" t={t} color={accent} />
        <PdfLanguagesBlock languages={languages} t={t} showLevel={false} />
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PdfHeading title="Education" t={t} color={accent} />
        <View style={{ gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{edu.school}</Text>
              <Text style={{ color: t.muted }}>
                {[edu.degree, edu.field].filter(Boolean).join(" - ")}
              </Text>
              <Text style={{ color: t.muted }}>
                {dateRange(edu, t.dateFmt, t.c)}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: t.muted }}>{gpaText(edu.gpa, t.c)}</Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.85)} />
            </View>
          ))}
        </View>
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PdfHeading title="Work Experience" t={t} color={accent} />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PdfHeading title="References" t={t} color={accent} />
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: sp(3) }}
        >
          {references.slice(0, 4).map((r) => (
            <View key={r.id} style={{ width: "47%", fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{r.name}</Text>
              <Text style={{ color: t.muted }}>{r.company}</Text>
            </View>
          ))}
        </View>
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t}>
      <View
        style={{
          backgroundColor: accent,
          paddingHorizontal: 27,
          paddingVertical: 21,
        }}
      >
        <Name
          t={t}
          color={headerInk}
          style={{ textTransform: "uppercase", letterSpacing: 1.4 }}
        />
        <JobTitle
          t={t}
          color={headerInk}
          style={{
            marginTop: sp(2),
            textTransform: "uppercase",
            letterSpacing: 2.4,
          }}
        />
        <HeaderTick t={t} width={40} marginTop={16} color={headerInk} />
        <View style={{ marginTop: sp(3) }}>
          <PdfContactInline
            contacts={contacts}
            t={t}
            color={headerInk}
            size={t.em(0.8)}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: "32%",
            backgroundColor: railBg,
            paddingHorizontal: 18,
            paddingVertical: 18,
            gap: 15,
          }}
        >
          {side}
        </View>
        <View
          style={{
            flexGrow: 1,
            flexBasis: 0,
            paddingHorizontal: 21,
            paddingVertical: 18,
            gap: 15,
          }}
        >
          {hasText(personal.summary) && (
            <View>
              <PdfHeading title="Professional Summary" t={t} color={accent} />
              <PdfRich
                html={personal.summary}
                t={t}
                color={t.muted}
                size={t.em(0.9)}
              />
            </View>
          )}
          {main}
        </View>
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * graduateFocus - education-first, soft boxed cards on a tinted page
 * ===================================================================== */

function GraduateFocusPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.c.accentColor || "#0F2942";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const pageBg = t.c.bodyBgColor || "#F8FAFC";

  const blocks: SectionBlocks = {
    education: education.length > 0 && (
      <SoftCard>
        <PdfHeading title="Education" t={t} color={accent} />
        <Entries>
          {education.map((edu) => (
            <PdfEducationBlock key={edu.id} edu={edu} t={t} accent={accent} />
          ))}
        </Entries>
      </SoftCard>
    ),
    experience: jobs.length > 0 && (
      <SoftCard>
        <PdfHeading title="Experience & Projects" t={t} color={accent} />
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </SoftCard>
    ),
    skills: skills.length > 0 && (
      <SoftCard>
        <PdfHeading title="Skills" t={t} color={accent} />
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </SoftCard>
    ),
    language: languages.length > 0 && (
      <SoftCard>
        <PdfHeading title="Languages" t={t} color={accent} />
        <Text style={{ fontSize: t.em(0.88), color: t.muted }}>
          {languages.map((l) => l.name).join(" · ")}
        </Text>
      </SoftCard>
    ),
    references: includeReferences && references.length > 0 && (
      <SoftCard>
        <PdfHeading title="References" t={t} color={accent} />
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: sp(3) }}
        >
          {references.slice(0, 2).map((r) => (
            <View key={r.id} style={{ width: "47%", fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{r.name}</Text>
              <Text style={{ color: t.muted }}>{r.company}</Text>
            </View>
          ))}
        </View>
      </SoftCard>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet
      t={t}
      style={{
        backgroundColor: pageBg,
        paddingHorizontal: 27,
        paddingVertical: 24,
      }}
    >
      <View
        style={{
          marginBottom: 15,
          backgroundColor: "#FFFFFF",
          borderRadius: 8 * PX_TO_PT,
          borderWidth: 0.5,
          borderColor: "rgba(226,232,240,0.8)",
          borderStyle: "solid",
          borderLeftWidth: 4 * PX_TO_PT,
          borderLeftColor: accent,
          paddingHorizontal: 18,
          paddingVertical: 15,
        }}
      >
        <Name t={t} color={t.ink} style={{ letterSpacing: -0.3 }} />
        <JobTitle
          t={t}
          color={accent}
          style={{
            marginTop: sp(1),
            fontFamily: t.variants.bold,
            textTransform: "uppercase",
            letterSpacing: 1.2,
          }}
        />
        <View style={{ marginTop: sp(2) }}>
          <PdfContactInline contacts={contacts} t={t} size={t.em(0.82)} />
        </View>
      </View>

      <Stack gap={12}>
        {hasText(personal.summary) && (
          <SoftCard>
            <PdfHeading title="Professional Summary" t={t} color={accent} />
            <PdfRich html={personal.summary} t={t} size={t.em(0.9)} />
          </SoftCard>
        )}
        {[...main, ...side]}
      </Stack>
    </Sheet>
  );
}

/* =====================================================================
 * corporateBand - full-width navy header band, ruled sidebar
 * ===================================================================== */

function CorporateBandPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const navy = t.c.sidebarBgColor || ATS.navy;
  const accent = t.c.accentColor || "#0E7490";
  const headerInk = contrastOn(navy);
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const head = (title: string) => (
    <PdfHeading title={title} t={t} color={navy} ruleColor={accent} />
  );

  const blocks: SectionBlocks = {
    experience: jobs.length > 0 && (
      <View>
        {head("Work Experience")}
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        {head("Education")}
        <View style={{ gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{edu.school}</Text>
              <Text style={{ color: t.muted }}>
                {[edu.degree, edu.field].filter(Boolean).join(" - ")}
              </Text>
              <Text style={{ color: t.muted }}>
                {dateRange(edu, t.dateFmt, t.c)}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: t.muted }}>{gpaText(edu.gpa, t.c)}</Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.85)} />
            </View>
          ))}
        </View>
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        {head("Core Skills")}
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        {head("Languages")}
        <Text style={{ fontSize: t.em(0.85), color: t.muted }}>
          {languages.map((l) => l.name).join(" · ")}
        </Text>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        {head("References")}
        <View style={{ gap: sp(2) }}>
          {references.slice(0, 2).map((r) => (
            <View key={r.id} style={{ fontSize: t.em(0.82) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{r.name}</Text>
              <Text style={{ color: t.muted }}>{r.company}</Text>
            </View>
          ))}
        </View>
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t}>
      <View
        style={{
          backgroundColor: navy,
          paddingHorizontal: 30,
          paddingVertical: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Name
              t={t}
              color={headerInk}
              style={{ textTransform: "uppercase", letterSpacing: 1.6 }}
            />
            <JobTitle
              t={t}
              color={headerInk}
              style={{
                marginTop: sp(2),
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            />
          </View>
          <View style={{ maxWidth: "42%", alignItems: "flex-end" }}>
            <PdfContactLines
              contacts={contacts}
              t={t}
              color={headerInk}
              icons={false}
              size={t.em(0.78)}
              gap={0}
            />
          </View>
        </View>
        <HeaderTick t={t} width={48} marginTop={20} color={accent} />
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 24,
          paddingHorizontal: 27,
          paddingVertical: 18,
        }}
      >
        <View style={{ flexGrow: 1.4, flexBasis: 0, gap: 15 }}>
          {hasText(personal.summary) && (
            <View>
              {head("Professional Summary")}
              <PdfRich html={personal.summary} t={t} size={t.em(0.9)} />
            </View>
          )}
          {main}
        </View>
        <View
          style={{
            width: "34%",
            gap: 15,
            paddingLeft: 18,
            borderLeftWidth: 0.5,
            borderLeftColor: ATS.line,
            borderLeftStyle: "solid",
          }}
        >
          {side}
        </View>
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * warmColumns - ruled header over two equal columns
 * ===================================================================== */

function WarmColumnsPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.accent;
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const head = (title: string) => (
    <PdfHeading
      title={title}
      t={t}
      color={accent}
      ruleWidth="full"
      ruleColor={ATS.line}
    />
  );

  const blocks: SectionBlocks = {
    education: education.length > 0 && (
      <View>
        {head("Education")}
        <View style={{ gap: sp(3) }}>
          {education.map((edu) => (
            <View key={edu.id} style={{ fontSize: t.em(0.88) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{edu.school}</Text>
              <Text style={{ color: t.muted }}>
                {[edu.degree, edu.field].filter(Boolean).join(" - ")}
              </Text>
              <Text style={{ color: t.muted }}>
                {dateRange(edu, t.dateFmt, t.c)}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: t.muted }}>{gpaText(edu.gpa, t.c)}</Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.88)} />
            </View>
          ))}
        </View>
      </View>
    ),
    skills: skills.length > 0 && (
      <View>
        {head("Skills")}
        <PdfSkillsList skills={skills} t={t} fill={accent} />
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        {head("Languages")}
        <Text style={{ fontSize: t.em(0.88), color: t.muted }}>
          {languages.map((l) => l.name).join(" · ")}
        </Text>
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        {head("Work Experience")}
        <Entries>
          {jobs.map((job) => (
            <PdfJobBlock key={job.id} job={job} t={t} />
          ))}
        </Entries>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        {head("References")}
        <View style={{ gap: sp(3) }}>
          {references.slice(0, 4).map((r) => (
            <View key={r.id} style={{ fontSize: t.em(0.85) }}>
              <Text style={{ fontFamily: t.variants.bold }}>{r.name}</Text>
              <Text style={{ color: t.muted }}>
                {[r.jobTitle, r.company].filter(Boolean).join(" · ")}
              </Text>
              {r.phone ? (
                <Text style={{ color: t.muted }}>{r.phone}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t}>
      <View
        style={{
          paddingHorizontal: 30,
          paddingTop: 27,
          paddingBottom: 18,
          borderBottomWidth: 0.5,
          borderBottomColor: ATS.line,
          borderBottomStyle: "solid",
        }}
      >
        <Name t={t} color={t.ink} style={{ letterSpacing: -0.3 }} />
        <JobTitle t={t} color={accent} style={{ marginTop: sp(1) }} />
        <View style={{ marginTop: sp(2.5) }}>
          <PdfContactInline contacts={contacts} t={t} size={t.em(0.82)} />
        </View>
      </View>

      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: "50%",
            gap: 18,
            paddingHorizontal: 27,
            paddingVertical: 21,
            borderRightWidth: 0.5,
            borderRightColor: ATS.line,
            borderRightStyle: "solid",
          }}
        >
          {hasText(personal.summary) && (
            <View>
              {head("Professional Summary")}
              <PdfRich html={personal.summary} t={t} size={t.em(0.88)} />
            </View>
          )}
          {side}
        </View>
        <View
          style={{
            width: "50%",
            gap: 18,
            paddingHorizontal: 27,
            paddingVertical: 21,
          }}
        >
          {main}
        </View>
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * monoPill - monochrome pill headings with icons
 * ===================================================================== */

function MonoPillPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const charcoal = t.c.sidebarBgColor || t.c.accentColor || "#2F2F2F";
  const muted = "#5A5A5A";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );

  const blocks: SectionBlocks = {
    skills: skills.length > 0 && (
      <View>
        <PillHeading title="Skills" icon="sparkles" color={charcoal} t={t} />
        <View style={{ marginTop: sp(3) }}>
          <PdfSkillsList skills={skills} t={t} color={t.ink} fill={charcoal} />
        </View>
      </View>
    ),
    language: languages.length > 0 && (
      <View>
        <PillHeading title="Languages" icon="languages" color={charcoal} t={t} />
        <View style={{ marginTop: sp(3) }}>
          <PdfLanguagesBlock languages={languages} t={t} color={muted} />
        </View>
      </View>
    ),
    education: education.length > 0 && (
      <View>
        <PillHeading title="Education" icon="graduationCap" color={charcoal} t={t} />
        <Spine color={charcoal}>
          {education.map((edu) => (
            <View
              key={edu.id}
              style={{ position: "relative", fontSize: t.em(0.88) }}
            >
              <Bullet color={charcoal} />
              <Text style={{ fontFamily: t.variants.bold }}>
                {[edu.degree, edu.field].filter(Boolean).join(" ") || edu.school}
              </Text>
              <Text style={{ color: muted }}>
                {dateRange(edu, t.dateFmt, t.c)}
              </Text>
              <Text style={{ color: muted, fontFamily: t.variants.italic }}>
                {edu.school}
              </Text>
              {edu.gpa ? (
                <Text style={{ color: muted }}>{gpaText(edu.gpa, t.c)}</Text>
              ) : null}
              <PdfRich html={edu.description} t={t} size={t.em(0.88)} />
            </View>
          ))}
        </Spine>
      </View>
    ),
    experience: jobs.length > 0 && (
      <View>
        <PillHeading title="Work Experience" icon="briefcase" color={charcoal} t={t} />
        <Spine color={charcoal}>
          {jobs.map((job) => (
            <View
              key={job.id}
              style={{ position: "relative", fontSize: t.em(0.88) }}
            >
              <Bullet color={charcoal} />
              <Text style={{ fontFamily: t.variants.bold }}>
                {job.company || job.jobTitle}
              </Text>
              <Text style={{ color: muted }}>
                {dateRange(job, t.dateFmt, t.c)}
              </Text>
              {job.company && job.jobTitle ? (
                <Text style={{ fontFamily: t.variants.bold }}>
                  {job.jobTitle}
                </Text>
              ) : null}
              {job.location ? (
                <Text style={{ color: muted }}>{job.location}</Text>
              ) : null}
              <PdfRich html={job.description} t={t} size={t.em(0.88)} />
            </View>
          ))}
        </Spine>
      </View>
    ),
    references: includeReferences && references.length > 0 && (
      <View>
        <PillHeading title="References" icon="users" color={charcoal} t={t} />
        <View style={{ marginTop: sp(3) }}>
          <PdfReferencesBlock
            references={references}
            includeReferences={includeReferences}
            t={t}
            muted={muted}
          />
        </View>
      </View>
    ),
  };
  const { main, sidebar: side } = partitionBlocks(t, blocks);

  return (
    <Sheet t={t} style={{ flexDirection: "row" }}>
      <View
        style={{
          width: "34%",
          paddingHorizontal: 15,
          paddingVertical: 18,
          gap: 15,
        }}
      >
        <PdfFullBleedPhoto t={t} height={160} fill={charcoal} railWidth={165} />
        <View>
          <Name
            t={t}
            color={t.ink}
            leading={1.25}
            style={{ textTransform: "uppercase", letterSpacing: 1.2 }}
          />
          <JobTitle
            t={t}
            color={muted}
            style={{
              marginTop: sp(2),
              textTransform: "uppercase",
              letterSpacing: 1.8,
            }}
          />
          <HeaderTick t={t} width={36} marginTop={12} color={charcoal} />
        </View>
        {contacts.length > 0 && (
          <View>
            <PillHeading title="Contact" icon="contact" color={charcoal} t={t} />
            <View style={{ marginTop: sp(3) }}>
              <PdfContactLines contacts={contacts} t={t} size={t.em(0.82)} />
            </View>
          </View>
        )}
        {side}
      </View>

      <View
        style={{
          flexGrow: 1,
          flexBasis: 0,
          paddingHorizontal: 18,
          paddingVertical: 18,
          gap: 15,
        }}
      >
        {hasText(personal.summary) && (
          <View>
            <PillHeading title="About Me" icon="user" color={charcoal} t={t} />
            <View style={{ marginTop: sp(3) }}>
              <PdfRich
                html={personal.summary}
                t={t}
                size={t.em(0.88)}
                align="justify"
              />
            </View>
          </View>
        )}
        {main}
      </View>
    </Sheet>
  );
}

/* =====================================================================
 * cleanHeaderSplit - header with badged contacts, ruled two-column body.
 * This layout has a fixed structure in the preview (no section reordering),
 * so the PDF mirrors that order exactly.
 * ===================================================================== */

function CleanHeaderSplitPdf({ t }: { t: PdfTheme }) {
  const { personal, education, skills, languages, references, includeReferences } =
    t.resume;
  const accent = t.accent;
  const ink = t.c.bodyTextColor || "#111111";
  const muted = "#6B6B6B";
  const line = "#D4D4D4";
  const contacts = personalContactLines(personal);
  const jobs = normalizeJobs(
    t.resume.experience,
    t.resume.noExperience,
    t.resume.experienceOrder,
    t.c,
  );
  const { name: nameColor, title: titleColor } = headerColors(t, "#FFFFFF");
  const showRefs = includeReferences && references.length > 0;

  return (
    <Sheet t={t}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          paddingHorizontal: 27,
          paddingTop: 24,
          paddingBottom: 12,
        }}
      >
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <Name t={t} color={nameColor} leading={1} style={{ letterSpacing: -0.3 }} />
          <JobTitle
            t={t}
            color={titleColor || muted}
            style={{
              marginTop: sp(2.5),
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          />
          <HeaderTick t={t} width={40} marginTop={16} />
        </View>
        <View style={{ width: "42%", gap: sp(1.5) }}>
          {contacts.map((c) => (
            <View
              key={c.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: sp(2),
              }}
            >
              <View
                style={{
                  width: sp(4),
                  height: sp(4),
                  borderRadius: sp(2),
                  backgroundColor: accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PdfIcon
                  icon={CONTACT_BADGE_ICONS[c.kind]}
                  size={sp(2.5)}
                  color={contrastOn(accent)}
                />
              </View>
              <Text style={{ fontSize: t.em(0.8), flexShrink: 1 }}>
                {c.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View
        style={{ marginHorizontal: 27, height: PX_TO_PT, backgroundColor: line }}
      />

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 27,
          paddingVertical: 15,
        }}
      >
        <View style={{ width: "32%", paddingRight: 18, gap: 15 }}>
          {education.length > 0 && (
            <View>
              <SplitTitle title="Education" color={accent} t={t} />
              <View style={{ gap: sp(3) }}>
                {education.map((edu) => (
                  <View key={edu.id} style={{ fontSize: t.em(0.88) }}>
                    <Text style={{ fontFamily: t.variants.bold }}>
                      {[edu.degree, edu.field].filter(Boolean).join(" ") ||
                        edu.school}
                    </Text>
                    <Text style={{ color: muted }}>{edu.school}</Text>
                    <Text style={{ color: muted }}>
                      {dateRange(edu, t.dateFmt, t.c)}
                    </Text>
                    {edu.gpa ? (
                      <Text style={{ color: muted }}>
                        {gpaText(edu.gpa, t.c)}
                      </Text>
                    ) : null}
                    <PdfRich
                      html={edu.description}
                      t={t}
                      color={ink}
                      size={t.em(0.88)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
          {skills.length > 0 && (
            <View>
              <SplitTitle title="Expertise" color={accent} t={t} />
              <PdfSkillsList
                skills={skills}
                t={t}
                color={muted}
                fill={accent}
              />
            </View>
          )}
          {languages.length > 0 && (
            <View>
              <SplitTitle title="Languages" color={accent} t={t} />
              <PdfLanguagesBlock languages={languages} t={t} color={muted} />
            </View>
          )}
          {showRefs && (
            <View>
              <SplitTitle title="References" color={accent} t={t} />
              <PdfReferencesBlock
                references={references}
                includeReferences={includeReferences}
                t={t}
                muted={muted}
                max={4}
              />
            </View>
          )}
        </View>

        <View style={{ width: PX_TO_PT, backgroundColor: line }} />

        <View style={{ flexGrow: 1, flexBasis: 0, paddingLeft: 18, gap: 15 }}>
          {hasText(personal.summary) && (
            <View>
              <SplitTitle title="Profile" color={accent} t={t} />
              <PdfRich
                html={personal.summary}
                t={t}
                color={ink}
                size={t.em(0.9)}
                align="justify"
              />
            </View>
          )}
          {jobs.length > 0 && (
            <View>
              <SplitTitle title="Experience" color={accent} t={t} />
              <Spine color="#BDBDBD" marginTop={1}>
                {jobs.map((job) => (
                  <View
                    key={job.id}
                    style={{ position: "relative", fontSize: t.em(0.88) }}
                  >
                    <Bullet color={accent} />
                    <Text style={{ fontFamily: t.variants.bold }}>
                      {job.jobTitle}
                    </Text>
                    <Text style={{ color: muted }}>
                      {[job.company, job.location, dateRange(job, t.dateFmt, t.c)]
                        .filter(Boolean)
                        .join(" / ")}
                    </Text>
                    <PdfRich
                      html={job.description}
                      t={t}
                      color={ink}
                      size={t.em(0.88)}
                    />
                  </View>
                ))}
              </Spine>
            </View>
          )}
        </View>
      </View>
    </Sheet>
  );
}

/** icon per contact kind for cleanHeaderSplit's round accent badges */
const CONTACT_BADGE_ICONS: Record<ContactLineItem["kind"], IconKey> = {
  phone: "phone",
  email: "mail",
  location: "pin",
  nationality: "flag",
  passport: "id",
  link: "link",
};
