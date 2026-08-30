import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "../../../types/resume";
import { extraExperienceTitle } from "../../../lib/experienceDisplay";
import { hasVisibleText, richTextToPdf } from "../../../lib/richTextToPdf";
import { pdfFontFamily } from "../../../lib/fonts";
import { contrastOn } from "../../../lib/color";
import {
  headingLang,
  resumeHeading,
  resumeNeedsKhmerFont,
  resumePresent,
} from "../../../lib/resumeHeadings";
import { registerPdfFonts } from "./registerPdfFonts";

registerPdfFonts();

function h(en: string, resume: Resume) {
  return resumeHeading(en, resume.customization);
}

function headingCap(c: Resume["customization"]): "uppercase" | "none" {
  return headingLang(c) === "km" ? "none" : "uppercase";
}

function headingTrack(c: Resume["customization"]) {
  return headingLang(c) === "km" ? 0 : 0.6;
}

function fmtYear(value: string) {
  if (!value) return "";
  const [y] = value.split("-");
  return y || value;
}

function range(
  start: string,
  end: string,
  current: boolean,
  customization?: Resume["customization"],
) {
  const s = fmtYear(start);
  const e = current ? resumePresent(customization) : fmtYear(end);
  if (!s && !e) return "";
  return `${s} – ${e}`;
}

function websiteOf(resume: Resume) {
  const p = resume.personal;
  return (
    p.website[0]?.url || p.portfolio[0]?.url || p.linkedin[0]?.url || ""
  );
}

function rte(
  html: string,
  color: string,
  resume: Resume,
  fontSize = 9,
) {
  if (!hasVisibleText(html)) return null;
  const font = pdfFontFamily(
    resume.customization.fontFamily,
    resume.customization.headingLanguage,
    resumeNeedsKhmerFont(resume),
  );
  return richTextToPdf(html, {
    color,
    fontSize,
    fontFamily: font,
    bulletStyle: resume.customization.bulletStyle,
  });
}

function eduNotes(html: string, resume: Resume, color = "#4B5563") {
  return rte(html, color, resume, 8);
}

function pdfSkills(
  skills: Resume["skills"],
  resume: Resume,
  color = "#1E293B",
  fill?: string,
) {
  if (!skills.length) return null;
  const accent = fill || resume.customization.accentColor || "#0F2942";
  if (resume.customization.skillsDisplay === "list") {
    return skills.map((sk) => (
      <Text key={sk.id} style={{ color, fontSize: 9, marginTop: 2 }}>
        • {sk.name}
      </Text>
    ));
  }
  return skills.map((sk) => {
    const filled = Math.max(1, Math.min(5, Math.round(sk.level || 3)));
    return (
      <View key={sk.id} style={{ marginTop: 4 }}>
        <Text style={{ color, fontSize: 9 }}>{sk.name}</Text>
        <View style={{ flexDirection: "row", marginTop: 3 }}>
          {Array.from({ length: 5 }).map((_, d) => (
            <View
              key={d}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                marginRight: 3,
                backgroundColor: d < filled ? accent : "rgba(148,163,184,0.55)",
              }}
            />
          ))}
        </View>
      </View>
    );
  });
}

function combinedJobs(
  experience: Resume["experience"],
  noExperience: Resume["noExperience"],
  order?: string[],
  customization?: Resume["customization"],
) {
  const extras = noExperience.map((n) => ({
    id: n.id,
    jobTitle: extraExperienceTitle(n, customization),
    company: n.subtitle,
    startDate: n.startDate,
    endDate: n.endDate,
    current: n.current,
    description: n.description,
    location: "",
  }));
  const all = [...experience, ...extras];
  if (!order?.length) return all;
  const byId = new Map(all.map((item) => [item.id, item]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((item): item is (typeof all)[number] => !!item);
  const used = new Set(ordered.map((item) => item.id));
  return [...ordered, ...all.filter((item) => !used.has(item.id))];
}

/** PDF twins of the special DOM layouts - approximate composition for download fidelity. */
export function SpecialPdfDocument({ resume }: { resume: Resume }) {
  const variant = resume.customization.layoutVariant;
  if (variant === "designerBlock") return <DesignerPdf resume={resume} />;
  if (variant === "techSplit") return <TechPdf resume={resume} />;
  if (variant === "bankingClean") return <BankingPdf resume={resume} />;
  if (variant === "freshSidebar") return <FreshPdf resume={resume} />;
  if (variant === "navyAnalyst") return <NavyPdf resume={resume} />;
  if (variant === "ribbonFold") return <RibbonPdf resume={resume} />;
  if (variant === "graphicPro") return <GraphicPdf resume={resume} />;
  if (variant === "executiveCard") return <ExecutivePdf resume={resume} />;
  if (variant === "monoTimeline") return <MonoPdf resume={resume} />;
  if (variant === "editorialClassic") return <MonoPdf resume={resume} />;
  if (variant === "compactTech") return <MonoPdf resume={resume} />;
  if (variant === "graduateFocus") return <MonoPdf resume={resume} />;
  if (variant === "corporateBand") return <BankingPdf resume={resume} />;
  if (variant === "warmColumns") return <MonoPdf resume={resume} />;
  if (variant === "monoPill") return <MonoPdf resume={resume} />;
  if (variant === "cleanHeaderSplit") return <MonoPdf resume={resume} />;
  return null;
}

function DesignerPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, languages, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#0F2942";
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { fontFamily: font, fontSize: 10, color: "#1E293B" },
    left: { position: "absolute", left: 0, top: 0, bottom: 0, width: "34%", backgroundColor: sidebar, color: "#fff" },
    photo: { width: "100%", height: 180, objectFit: "cover" },
    nameBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, color: "#fff" },
    name: { fontSize: 16, fontWeight: 600, color: "#fff" },
    title: { fontSize: 9, marginTop: 4, color: "#fff" },
    sidePad: { padding: 14, gap: 10 },
    sideH: { fontSize: 9, fontWeight: 700, textTransform: headingCap(c), letterSpacing: headingTrack(c), marginBottom: 4 },
    right: { marginLeft: "34%", backgroundColor: "#FFFFFF", padding: 18, gap: 12 },
    h: { fontSize: 9, fontWeight: 700, textTransform: headingCap(c), letterSpacing: headingTrack(c), marginBottom: 6, color: sidebar, borderBottomWidth: 0.5, borderBottomColor: "#CBD5E1", paddingBottom: 3 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page} wrap>
        <View style={s.left} fixed>
          {c.showPhoto && personal.photoUrl ? (
            <Image src={personal.photoUrl} style={s.photo} />
          ) : (
            <View style={[s.photo, { backgroundColor: sidebar }]} />
          )}
          <View style={s.nameBlock}>
            <Text style={s.name}>{personal.fullName}</Text>
            <Text style={s.title}>{personal.jobTitle}</Text>
          </View>
          <View style={s.sidePad}>
            {personal.phone ? <Text>{personal.phone}</Text> : null}
            {personal.email ? <Text>{personal.email}</Text> : null}
            {personal.location ? <Text>{personal.location}</Text> : null}
            {websiteOf(resume) ? <Text>{websiteOf(resume)}</Text> : null}
            {skills.length > 0 && (
              <View>
                <Text style={s.sideH}>{h("Skills", resume)}</Text>
                {pdfSkills(skills, resume, "#fff", "#fff")}
              </View>
            )}
            {languages.length > 0 && (
              <View>
                <Text style={s.sideH}>{h("Languages", resume)}</Text>
                {languages.map((l) => (
                  <Text key={l.id}>{l.name}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={s.right}>
          {hasVisibleText(personal.summary) && (
            <View>
              <Text style={s.h}>{h("Professional Summary", resume)}</Text>
              {rte(personal.summary, "#1E293B", resume)}
            </View>
          )}
          {education.length > 0 && (
            <View>
              <Text style={s.h}>{h("Education", resume)}</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: 700 }}>{edu.school}</Text>
                  <Text style={{ color: "#64748B", fontSize: 9 }}>
                    {[edu.degree, edu.field, range(edu.startDate, edu.endDate, edu.current, c)]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  {eduNotes(edu.description, resume)}
                </View>
              ))}
            </View>
          )}
          {jobs.length > 0 && (
            <View>
              <Text style={s.h}>{h("Work Experience", resume)}</Text>
              {jobs.map((job) => (
                <View key={job.id} style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
                  <Text style={{ color: "#64748B", fontSize: 9 }}>
                    {[job.company, range(job.startDate, job.endDate, job.current, c)]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  {rte(job.description, "#1E293B", resume)}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

function TechPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#3C4452";
  const nameInk = contrastOn(sidebar);
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#1E293B" },
    main: { flex: 1 },
    header: { backgroundColor: sidebar, color: nameInk, padding: 18 },
    name: { fontSize: 18, fontWeight: 600, color: nameInk },
    title: { fontSize: 10, marginTop: 4, color: nameInk },
    body: { padding: 18, gap: 12 },
    side: { width: "34%", backgroundColor: sidebar, color: "#fff", padding: 14, gap: 10 },
    photo: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", objectFit: "cover" },
    h: { fontSize: 11, fontWeight: 700, textTransform: headingCap(c), marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.main}>
          <View style={s.header}>
            <Text style={s.name}>{personal.fullName}</Text>
            <Text style={s.title}>{personal.jobTitle}</Text>
          </View>
          <View style={s.body}>
            {hasVisibleText(personal.summary) && (
              <View>
                <Text style={s.h}>{h("Professional Summary", resume)}</Text>
                {rte(personal.summary, "#1E293B", resume)}
              </View>
            )}
            {jobs.length > 0 && (
              <View>
                <Text style={s.h}>{h("Work Experience", resume)}</Text>
                {jobs.map((job) => (
                  <View key={job.id} style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
                    <Text style={{ color: "#6B7280", fontSize: 9 }}>
                      {[job.company, range(job.startDate, job.endDate, job.current, c)].filter(Boolean).join(" · ")}
                    </Text>
                    {rte(job.description, "#1E293B", resume)}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? (
            <Image src={personal.photoUrl} style={s.photo} />
          ) : null}
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {personal.location ? <Text>{personal.location}</Text> : null}
          {websiteOf(resume) ? <Text>{websiteOf(resume)}</Text> : null}
          {skills.length > 0 && (
            <View>
              <Text style={s.h}>{h("Skills", resume)}</Text>
              {pdfSkills(skills, resume)}
            </View>
          )}
          {education.length > 0 && (
            <View>
              <Text style={s.h}>{h("Education", resume)}</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: 700 }}>
                    {edu.degree || edu.school}
                  </Text>
                  <Text>{[edu.school, range(edu.startDate, edu.endDate, edu.current, c)].filter(Boolean).join(" · ")}</Text>
                  {eduNotes(edu.description, resume, "#fff")}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

function BankingPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, languages, references, includeReferences, customization: c } = resume;
  const accent = c.accentColor || "#0891B2";
  const footer = c.sidebarBgColor || "#2C333A";
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { fontFamily: font, fontSize: 10, color: "#2C333A", paddingTop: 28, paddingHorizontal: 28, paddingBottom: 20 },
    accent: { position: "absolute", top: 0, left: 0, width: 90, height: 10, backgroundColor: accent },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 10, backgroundColor: footer },
    header: { flexDirection: "row", gap: 14, marginBottom: 16 },
    photo: { width: 70, height: 70, borderRadius: 35, objectFit: "cover" },
    name: { fontSize: 22, fontWeight: 300, textTransform: headingCap(c), letterSpacing: 1 },
    cols: { flexDirection: "row", gap: 18 },
    left: { width: "36%", gap: 10 },
    right: { flex: 1, gap: 10 },
    h: { fontSize: 10, fontWeight: 700, textTransform: headingCap(c), marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#2C333A", paddingBottom: 2 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        {c.topAccentBar ? <View style={s.accent} fixed /> : null}
        <View style={s.header}>
          {c.showPhoto && personal.photoUrl ? (
            <Image src={personal.photoUrl} style={s.photo} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{personal.fullName}</Text>
            <Text>{personal.jobTitle}</Text>
            <Text style={{ fontSize: 8, marginTop: 6 }}>
              {[personal.phone, personal.email, websiteOf(resume)].filter(Boolean).join("   ")}
            </Text>
          </View>
        </View>
        <View style={s.cols}>
          <View style={s.left}>
            {hasVisibleText(personal.summary) && (
              <View>
                <Text style={s.h}>Summary</Text>
                {rte(personal.summary, "#2C333A", resume)}
              </View>
            )}
            {education.length > 0 && (
              <View>
                <Text style={s.h}>{h("Education", resume)}</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: 700 }}>{edu.degree || edu.school}</Text>
                    <Text>{edu.school}</Text>
                    <Text>{range(edu.startDate, edu.endDate, edu.current, c)}</Text>
                    {eduNotes(edu.description, resume)}
                  </View>
                ))}
              </View>
            )}
            {skills.length > 0 && (
              <View>
                <Text style={s.h}>{h("Skills", resume)}</Text>
                {pdfSkills(skills, resume)}
              </View>
            )}
            {languages.length > 0 && (
              <View>
                <Text style={s.h}>{h("Language", resume)}</Text>
                {languages.map((l) => (
                  <Text key={l.id}>• {l.name}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={s.right}>
            {jobs.length > 0 && (
              <View>
                <Text style={s.h}>{h("Work Experience", resume)}</Text>
                {jobs.map((job) => (
                  <View key={job.id} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
                      <Text>{range(job.startDate, job.endDate, job.current, c)}</Text>
                    </View>
                    <Text>{[job.company, job.location].filter(Boolean).join(" | ")}</Text>
                    {rte(job.description, "#2C333A", resume)}
                  </View>
                ))}
              </View>
            )}
            {includeReferences && references.length > 0 && (
              <View>
                <Text style={s.h}>{h("References", resume)}</Text>
                {references.slice(0, 4).map((r) => (
                  <View key={r.id} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: 700 }}>{r.name}</Text>
                    <Text>{[r.jobTitle, r.company].filter(Boolean).join(", ")}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        {c.footerBar ? <View style={s.footer} fixed /> : null}
      </Page>
    </Document>
  );
}

function FreshPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, references, includeReferences, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#2C3E50";
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#1A1A1A", padding: 18, gap: 12 },
    main: { flex: 1, gap: 10 },
    name: { fontSize: 20, fontWeight: 700, textTransform: headingCap(c) },
    title: { fontSize: 11, color: "#5B6470", textTransform: headingCap(c), marginTop: 2 },
    h: { fontSize: 10, fontWeight: 700, textTransform: headingCap(c), borderBottomWidth: 0.5, borderBottomColor: "#D0D5DD", paddingBottom: 3, marginBottom: 6 },
    side: { width: "34%", backgroundColor: sidebar, color: "#fff", padding: 14, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, gap: 10 },
    photo: { width: 90, height: 90, borderRadius: 10, alignSelf: "center", objectFit: "cover" },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.main}>
          <View>
            <Text style={s.name}>{personal.fullName}</Text>
            <Text style={s.title}>{personal.jobTitle}</Text>
          </View>
          {hasVisibleText(personal.summary) && (
            <View>
              <Text style={s.h}>{h("Professional Summary", resume)}</Text>
              {rte(personal.summary, "#5B6470", resume)}
            </View>
          )}
          {jobs.length > 0 && (
            <View>
              <Text style={s.h}>{h("Work Experience", resume)}</Text>
              {jobs.map((job) => (
                <View key={job.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: 700 }}>{job.company || job.jobTitle}</Text>
                    <Text style={{ color: "#5B6470" }}>{range(job.startDate, job.endDate, job.current, c)}</Text>
                  </View>
                  {rte(job.description, "#5B6470", resume)}
                </View>
              ))}
            </View>
          )}
          {includeReferences && references.length > 0 && (
            <View>
              <Text style={s.h}>{h("Reference", resume)}</Text>
              {references.slice(0, 4).map((r) => (
                <View key={r.id} style={{ marginBottom: 4 }}>
                  <Text style={{ fontWeight: 700 }}>{r.name}</Text>
                  <Text style={{ color: "#5B6470" }}>{[r.company, r.jobTitle].filter(Boolean).join(" / ")}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? (
            <Image src={personal.photoUrl} style={s.photo} />
          ) : null}
          <Text style={{ fontWeight: 700, textTransform: headingCap(c) }}>{h("Contact", resume)}</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {personal.location ? <Text>{personal.location}</Text> : null}
          {websiteOf(resume) ? <Text>{websiteOf(resume)}</Text> : null}
          {education.length > 0 && (
            <View>
              <Text style={{ fontWeight: 700, textTransform: headingCap(c), marginBottom: 4 }}>{h("Education", resume)}</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <Text>{range(edu.startDate, edu.endDate, edu.current, c)}</Text>
                  <Text style={{ fontWeight: 700, textTransform: headingCap(c) }}>{edu.school}</Text>
                  {eduNotes(edu.description, resume, "#fff")}
                </View>
              ))}
            </View>
          )}
          {skills.length > 0 && (
            <View>
              <Text style={{ fontWeight: 700, textTransform: headingCap(c), marginBottom: 4 }}>{h("Skills", resume)}</Text>
              {pdfSkills(skills, resume)}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

function NavyPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, languages, references, includeReferences, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#1A2C4E";
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#1F2937" },
    side: { width: "32%", backgroundColor: sidebar, color: "#fff", padding: 14, gap: 10 },
    photo: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", objectFit: "cover" },
    main: { flex: 1, padding: 18, gap: 10 },
    name: { fontSize: 20, fontWeight: 700, textTransform: headingCap(c) },
    rule: { height: 3, backgroundColor: sidebar, marginTop: 8, marginBottom: 8 },
    h: { fontSize: 11, fontWeight: 700, textTransform: headingCap(c), marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? <Image src={personal.photoUrl} style={s.photo} /> : null}
          <Text style={{ fontWeight: 700, textTransform: headingCap(c) }}>{h("Contact", resume)}</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {personal.location ? <Text>{personal.location}</Text> : null}
          {education.map((edu) => (
            <View key={edu.id}>
              <Text>{range(edu.startDate, edu.endDate, edu.current, c)}</Text>
              <Text style={{ fontWeight: 700 }}>{edu.school}</Text>
              {eduNotes(edu.description, resume, "#fff")}
            </View>
          ))}
          {pdfSkills(skills, resume, "#fff", "#fff")}
          {languages.map((l) => <Text key={l.id}>• {l.name}</Text>)}
        </View>
        <View style={s.main}>
          <Text style={s.name}>{personal.fullName}</Text>
          <Text>{personal.jobTitle}</Text>
          <View style={s.rule} />
          {hasVisibleText(personal.summary) && (
            <View>
              <Text style={s.h}>{h("Professional Summary", resume)}</Text>
              {rte(personal.summary, "#6B7280", resume)}
            </View>
          )}
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.company || job.jobTitle}</Text>
              <Text style={{ color: "#6B7280" }}>{range(job.startDate, job.endDate, job.current, c)}</Text>
              {rte(job.description, "#6B7280", resume)}
            </View>
          ))}
          {includeReferences && references.slice(0, 2).map((r) => (
            <Text key={r.id}>{r.name} - {r.company}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function RibbonPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#5A5A5A";
  const ribbon = c.accentColor || "#3F3F3F";
  const ribbonInk = contrastOn(ribbon);
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10 },
    side: { width: "34%", backgroundColor: sidebar, color: "#fff", padding: 12, gap: 8 },
    photo: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", objectFit: "cover", marginBottom: 8 },
    ribbon: { backgroundColor: ribbon, color: ribbonInk, textAlign: "center", padding: 5, fontSize: 9, fontWeight: 700, textTransform: headingCap(c), marginVertical: 4 },
    main: { flex: 1, padding: 16, gap: 8 },
    bar: { backgroundColor: ribbon, color: ribbonInk, textAlign: "center", padding: 6, fontWeight: 700, textTransform: headingCap(c), marginBottom: 6 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? <Image src={personal.photoUrl} style={s.photo} /> : null}
          <Text style={s.ribbon}>{h("Professional Summary", resume)}</Text>
          {rte(personal.summary, "#fff", resume, 8)}
          <Text style={s.ribbon}>{h("Skills", resume)}</Text>
          {pdfSkills(skills, resume, "#fff", "#fff")}
          <Text style={s.ribbon}>Contact Me</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
        </View>
        <View style={s.main}>
          <Text style={{ fontSize: 22, fontWeight: 700 }}>{personal.fullName}</Text>
          <Text style={{ textTransform: headingCap(c), letterSpacing: 2 }}>{personal.jobTitle}</Text>
          <Text style={s.bar}>{h("Education", resume)}</Text>
          {education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 700 }}>{edu.degree || edu.school}</Text>
              <Text>{range(edu.startDate, edu.endDate, edu.current, c)}</Text>
              {eduNotes(edu.description, resume)}
            </View>
          ))}
          <Text style={s.bar}>{h("Work Experience", resume)}</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
              <Text>{[job.company, range(job.startDate, job.endDate, job.current, c)].filter(Boolean).join(" | ")}</Text>
              {rte(job.description, "#444", resume)}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function GraphicPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, languages, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#1B2838";
  const nameInk = contrastOn(sidebar);
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#111827" },
    side: { width: "34%", backgroundColor: sidebar, color: nameInk },
    photo: { width: "100%", height: 160, objectFit: "cover" },
    sidePad: { padding: 12, gap: 8 },
    main: { flex: 1, padding: 16, gap: 10 },
    h: { fontSize: 11, fontWeight: 700, textTransform: headingCap(c), marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? <Image src={personal.photoUrl} style={s.photo} /> : null}
          <View style={s.sidePad}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: nameInk }}>{personal.fullName}</Text>
            <Text style={{ textTransform: headingCap(c), fontSize: 9, color: nameInk }}>{personal.jobTitle}</Text>
            {personal.email ? <Text>{personal.email}</Text> : null}
            {personal.phone ? <Text>{personal.phone}</Text> : null}
            {languages.map((l) => <Text key={l.id}>{l.name}</Text>)}
          </View>
        </View>
        <View style={s.main}>
          {hasVisibleText(personal.summary) && (
            <View>
              <Text style={s.h}>{h("Professional Summary", resume)}</Text>
              {rte(personal.summary, "#1E293B", resume)}
            </View>
          )}
          <Text style={s.h}>{h("Work Experience", resume)}</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
              <Text style={{ color: "#6B7280" }}>{range(job.startDate, job.endDate, job.current, c)} · {job.company}</Text>
              {rte(job.description, "#1E293B", resume)}
            </View>
          ))}
          <Text style={s.h}>{h("Skills", resume)}</Text>
          {pdfSkills(skills, resume)}
          {education.map((edu) => (
            <View key={edu.id}>
              <Text style={{ fontWeight: 700 }}>{edu.school}</Text>
              <Text>{range(edu.startDate, edu.endDate, edu.current, c)}</Text>
              {eduNotes(edu.description, resume)}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function ExecutivePdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, languages, references, includeReferences, customization: c } = resume;
  const navy = c.sidebarBgColor || "#1D2B45";
  const nameInk = contrastOn("#FFFFFF", navy);
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const parts = (personal.fullName || "").trim().split(/\s+/);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#111827", paddingTop: 20 },
    side: { width: "34%", backgroundColor: navy, color: "#fff", padding: 12, marginTop: 60, borderTopRightRadius: 40, gap: 8 },
    main: { flex: 1, paddingHorizontal: 16, gap: 8 },
    name: { color: nameInk, fontSize: 22, fontWeight: 700, textTransform: headingCap(c) },
    pill: { borderWidth: 1, borderColor: navy, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, color: navy, fontSize: 9, fontWeight: 700, textTransform: headingCap(c), alignSelf: "flex-start", marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {rte(personal.summary, "#fff", resume, 8)}
          <Text style={{ fontWeight: 700 }}>{h("Contact", resume)}</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {pdfSkills(skills, resume, "#fff", "#fff")}
          {languages.map((l) => <Text key={l.id}>{l.name}</Text>)}
        </View>
        <View style={s.main}>
          <Text style={{ color: nameInk }}>{parts[0]}</Text>
          <Text style={s.name}>{parts.slice(1).join(" ") || parts[0]}</Text>
          <Text>{personal.jobTitle}</Text>
          <Text style={s.pill}>{h("Work Experience", resume)}</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.company}</Text>
              <Text>{job.jobTitle} · {range(job.startDate, job.endDate, job.current, c)}</Text>
              {rte(job.description, "#6B7280", resume)}
            </View>
          ))}
          <Text style={s.pill}>{h("Education", resume)}</Text>
          {education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 4 }}>
              <Text>{edu.school} - {range(edu.startDate, edu.endDate, edu.current, c)}</Text>
              {eduNotes(edu.description, resume)}
            </View>
          ))}
          {includeReferences && references.slice(0, 2).map((r) => (
            <Text key={r.id}>{r.name}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function MonoPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, languages, references, includeReferences, customization: c } = resume;
  const accent = c.accentColor || "#111827";
  const font = pdfFontFamily(c.fontFamily, c.headingLanguage, resumeNeedsKhmerFont(resume));
  const jobs = combinedJobs(experience, noExperience, resume.experienceOrder, c);
  const s = StyleSheet.create({
    page: { fontFamily: font, fontSize: 10, color: "#1E293B", padding: 32 },
    accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accent },
    name: { fontSize: 22, fontWeight: 600 },
    title: { color: accent, marginTop: 4, marginBottom: 10 },
    h: { color: accent, fontSize: 9, fontWeight: 700, textTransform: headingCap(c), letterSpacing: 0.6, marginTop: 12, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#CBD5E1", paddingBottom: 3 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.accentBar} fixed />
        <Text style={s.name}>{personal.fullName}</Text>
        <Text style={s.title}>{personal.jobTitle}</Text>
        <Text style={{ color: "#6B7280", fontSize: 8, marginBottom: 10 }}>
          {[personal.phone, personal.email, personal.location, websiteOf(resume)].filter(Boolean).join("  ·  ")}
        </Text>
        {hasVisibleText(personal.summary) && (
          <View>
            <Text style={s.h}>{h("Professional Summary", resume)}</Text>
            {rte(personal.summary, "#6B7280", resume)}
          </View>
        )}
        <Text style={s.h}>{h("Work Experience", resume)}</Text>
        {jobs.map((job) => (
          <View key={job.id} style={{ marginBottom: 6 }}>
            <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
            <Text style={{ color: "#6B7280" }}>{job.company} · {range(job.startDate, job.endDate, job.current, c)}</Text>
            {rte(job.description, "#6B7280", resume)}
          </View>
        ))}
        <Text style={s.h}>{h("Education", resume)}</Text>
        {education.map((edu) => (
          <View key={edu.id} style={{ marginBottom: 4 }}>
            <Text>{edu.school} - {range(edu.startDate, edu.endDate, edu.current, c)}</Text>
            {eduNotes(edu.description, resume)}
          </View>
        ))}
        <Text style={s.h}>{h("Skills", resume)}</Text>
        {pdfSkills(skills, resume)}
        {languages.length > 0 && (
          <View>
            <Text style={s.h}>{h("Languages", resume)}</Text>
            <Text>{languages.map((l) => l.name).join("  ·  ")}</Text>
          </View>
        )}
        {includeReferences && references.length > 0 && (
          <View>
            <Text style={s.h}>{h("References", resume)}</Text>
            {references.slice(0, 2).map((r) => (
              <Text key={r.id}>{r.name}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
