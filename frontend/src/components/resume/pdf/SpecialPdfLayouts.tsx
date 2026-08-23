import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Resume } from "../../../types/resume";
import { hasVisibleText, richTextToPdf } from "../../../lib/richTextToPdf";
import { pdfFontFamily } from "../../../lib/fonts";

function fmtYear(value: string) {
  if (!value) return "";
  const [y] = value.split("-");
  return y || value;
}

function range(
  start: string,
  end: string,
  current: boolean,
) {
  const s = fmtYear(start);
  const e = current ? "Present" : fmtYear(end);
  if (!s && !e) return "";
  return `${s} – ${e}`;
}

function websiteOf(resume: Resume) {
  const p = resume.personal;
  return (
    p.website[0]?.url || p.portfolio[0]?.url || p.linkedin[0]?.url || ""
  );
}

/** PDF twins of the special DOM layouts — approximate composition for download fidelity. */
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
  const accent = c.accentColor || "#EA580C";
  const sidebar = c.sidebarBgColor || "#2A2A2A";
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { fontFamily: font, fontSize: 10, color: "#1A1A1A" },
    left: { position: "absolute", left: 0, top: 0, bottom: 0, width: "38%", backgroundColor: sidebar, color: "#fff" },
    photo: { width: "100%", height: 180, objectFit: "cover" },
    nameBlock: { backgroundColor: "#000", padding: 14 },
    name: { fontSize: 18, fontWeight: 700 },
    title: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 },
    sidePad: { padding: 14, gap: 10 },
    sideH: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
    right: { marginLeft: "38%", backgroundColor: "#F5F5F5" },
    white: { backgroundColor: "#fff", padding: 16, gap: 10 },
    gray: { backgroundColor: "#E8E8E8", padding: 16 },
    contact: { backgroundColor: accent, padding: 14, color: "#fff" },
    h: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 },
    row: { flexDirection: "row", gap: 8 },
    vLabel: { width: 14, fontSize: 9, fontWeight: 700, textTransform: "uppercase" },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page} wrap>
        <View style={s.left} fixed>
          {c.showPhoto && personal.photoUrl ? (
            <Image src={personal.photoUrl} style={s.photo} />
          ) : (
            <View style={[s.photo, { backgroundColor: "#777" }]} />
          )}
          <View style={s.nameBlock}>
            <Text style={s.name}>{personal.fullName}</Text>
            <Text style={s.title}>{personal.jobTitle}</Text>
          </View>
          <View style={s.sidePad}>
            {skills.length > 0 && (
              <View>
                <Text style={s.sideH}>Skills</Text>
                {skills.map((sk) => (
                  <Text key={sk.id}>• {sk.name}</Text>
                ))}
              </View>
            )}
            {languages.length > 0 && (
              <View>
                <Text style={s.sideH}>Languages</Text>
                {languages.map((l) => (
                  <Text key={l.id}>{l.name}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={s.right}>
          <View style={s.white}>
            {hasVisibleText(personal.summary) && (
              <View>
                <Text style={s.h}>Professional Summary</Text>
                {richTextToPdf(personal.summary, { color: "#1A1A1A", fontSize: 9 })}
              </View>
            )}
            {education.length > 0 && (
              <View style={s.row}>
                <Text style={s.vLabel}>Education</Text>
                <View style={{ flex: 1, gap: 6 }}>
                  {education.map((edu) => (
                    <View key={edu.id}>
                      <Text style={{ fontWeight: 700 }}>
                        {range(edu.startDate, edu.endDate, edu.current)}
                        {edu.degree ? ` | ${edu.degree}` : ""}
                      </Text>
                      <Text>{edu.school}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
          {jobs.length > 0 && (
            <View style={s.gray}>
              <View style={s.row}>
                <Text style={s.vLabel}>Work Experience</Text>
                <View style={{ flex: 1, gap: 8 }}>
                  {jobs.map((job) => (
                    <View key={job.id}>
                      <Text style={{ fontWeight: 700 }}>
                        {range(job.startDate, job.endDate, job.current)}
                        {job.jobTitle ? ` | ${job.jobTitle}` : ""}
                      </Text>
                      {richTextToPdf(job.description, { color: "#1A1A1A", fontSize: 9 })}
                      {job.company ? <Text>{job.company}</Text> : null}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          <View style={s.contact}>
            <Text style={[s.h, { color: "#fff" }]}>Contact</Text>
            {personal.phone ? <Text>{personal.phone}</Text> : null}
            {personal.email ? <Text>{personal.email}</Text> : null}
            {websiteOf(resume) ? <Text>{websiteOf(resume)}</Text> : null}
            {personal.location ? <Text>{personal.location}</Text> : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function TechPdf({ resume }: { resume: Resume }) {
  const { personal, experience, noExperience, education, skills, customization: c } = resume;
  const sidebar = c.sidebarBgColor || "#3C4452";
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#3C4452" },
    main: { flex: 1 },
    header: { backgroundColor: sidebar, color: "#fff", padding: 18 },
    name: { fontSize: 20, fontWeight: 700, textTransform: "uppercase" },
    title: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 },
    body: { padding: 18, gap: 12 },
    side: { width: "34%", backgroundColor: sidebar, color: "#fff", padding: 14, gap: 10 },
    photo: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", objectFit: "cover" },
    h: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
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
                <Text style={s.h}>Professional Summary</Text>
                {richTextToPdf(personal.summary, { color: "#6B7280", fontSize: 9 })}
              </View>
            )}
            {jobs.length > 0 && (
              <View>
                <Text style={s.h}>Work Experience</Text>
                {jobs.map((job) => (
                  <View key={job.id} style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: 700, textTransform: "uppercase" }}>{job.jobTitle}</Text>
                    <Text style={{ color: "#6B7280", fontSize: 9 }}>
                      {[job.company, range(job.startDate, job.endDate, job.current)].filter(Boolean).join(" · ")}
                    </Text>
                    {richTextToPdf(job.description, { color: "#6B7280", fontSize: 9 })}
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
              <Text style={s.h}>Skills</Text>
              {skills.map((sk) => (
                <Text key={sk.id}>• {sk.name}</Text>
              ))}
            </View>
          )}
          {education.length > 0 && (
            <View>
              <Text style={s.h}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: 700, textTransform: "uppercase" }}>
                    {edu.degree || edu.school}
                  </Text>
                  <Text>{[edu.school, range(edu.startDate, edu.endDate, edu.current)].filter(Boolean).join(" · ")}</Text>
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { fontFamily: font, fontSize: 10, color: "#2C333A", paddingTop: 28, paddingHorizontal: 28, paddingBottom: 20 },
    accent: { position: "absolute", top: 0, left: 0, width: 90, height: 10, backgroundColor: accent },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 10, backgroundColor: footer },
    header: { flexDirection: "row", gap: 14, marginBottom: 16 },
    photo: { width: 70, height: 70, borderRadius: 35, objectFit: "cover" },
    name: { fontSize: 22, fontWeight: 300, textTransform: "uppercase", letterSpacing: 1 },
    cols: { flexDirection: "row", gap: 18 },
    left: { width: "36%", gap: 10 },
    right: { flex: 1, gap: 10 },
    h: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#2C333A", paddingBottom: 2 },
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
                {richTextToPdf(personal.summary, { color: "#2C333A", fontSize: 9 })}
              </View>
            )}
            {education.length > 0 && (
              <View>
                <Text style={s.h}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: 700 }}>{edu.degree || edu.school}</Text>
                    <Text>{edu.school}</Text>
                    <Text>{range(edu.startDate, edu.endDate, edu.current)}</Text>
                  </View>
                ))}
              </View>
            )}
            {skills.length > 0 && (
              <View>
                <Text style={s.h}>Skills</Text>
                {skills.map((sk) => (
                  <Text key={sk.id}>• {sk.name}</Text>
                ))}
              </View>
            )}
            {languages.length > 0 && (
              <View>
                <Text style={s.h}>Language</Text>
                {languages.map((l) => (
                  <Text key={l.id}>• {l.name}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={s.right}>
            {jobs.length > 0 && (
              <View>
                <Text style={s.h}>Work Experience</Text>
                {jobs.map((job) => (
                  <View key={job.id} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
                      <Text>{range(job.startDate, job.endDate, job.current)}</Text>
                    </View>
                    <Text>{[job.company, job.location].filter(Boolean).join(" | ")}</Text>
                    {richTextToPdf(job.description, { color: "#2C333A", fontSize: 9 })}
                  </View>
                ))}
              </View>
            )}
            {includeReferences && references.length > 0 && (
              <View>
                <Text style={s.h}>References</Text>
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#1A1A1A", padding: 18, gap: 12 },
    main: { flex: 1, gap: 10 },
    name: { fontSize: 20, fontWeight: 700, textTransform: "uppercase" },
    title: { fontSize: 11, color: "#5B6470", textTransform: "uppercase", marginTop: 2 },
    h: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", borderBottomWidth: 0.5, borderBottomColor: "#D0D5DD", paddingBottom: 3, marginBottom: 6 },
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
              <Text style={s.h}>Professional Summary</Text>
              {richTextToPdf(personal.summary, { color: "#5B6470", fontSize: 9 })}
            </View>
          )}
          {jobs.length > 0 && (
            <View>
              <Text style={s.h}>Work Experience</Text>
              {jobs.map((job) => (
                <View key={job.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: 700 }}>{job.company || job.jobTitle}</Text>
                    <Text style={{ color: "#5B6470" }}>{range(job.startDate, job.endDate, job.current)}</Text>
                  </View>
                  {richTextToPdf(job.description, { color: "#5B6470", fontSize: 9 })}
                </View>
              ))}
            </View>
          )}
          {includeReferences && references.length > 0 && (
            <View>
              <Text style={s.h}>Reference</Text>
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
          <Text style={{ fontWeight: 700, textTransform: "uppercase" }}>Contact</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {personal.location ? <Text>{personal.location}</Text> : null}
          {websiteOf(resume) ? <Text>{websiteOf(resume)}</Text> : null}
          {education.length > 0 && (
            <View>
              <Text style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <Text>{range(edu.startDate, edu.endDate, edu.current)}</Text>
                  <Text style={{ fontWeight: 700, textTransform: "uppercase" }}>{edu.school}</Text>
                </View>
              ))}
            </View>
          )}
          {skills.length > 0 && (
            <View>
              <Text style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Skills</Text>
              {skills.map((sk) => (
                <Text key={sk.id}>• {sk.name}</Text>
              ))}
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#1F2937" },
    side: { width: "32%", backgroundColor: sidebar, color: "#fff", padding: 14, gap: 10 },
    photo: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", objectFit: "cover" },
    main: { flex: 1, padding: 18, gap: 10 },
    name: { fontSize: 20, fontWeight: 700, textTransform: "uppercase" },
    rule: { height: 3, backgroundColor: sidebar, marginTop: 8, marginBottom: 8 },
    h: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? <Image src={personal.photoUrl} style={s.photo} /> : null}
          <Text style={{ fontWeight: 700, textTransform: "uppercase" }}>Contact</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {personal.location ? <Text>{personal.location}</Text> : null}
          {education.map((edu) => (
            <View key={edu.id}>
              <Text>{range(edu.startDate, edu.endDate, edu.current)}</Text>
              <Text style={{ fontWeight: 700 }}>{edu.school}</Text>
            </View>
          ))}
          {skills.map((sk) => <Text key={sk.id}>• {sk.name}</Text>)}
          {languages.map((l) => <Text key={l.id}>• {l.name}</Text>)}
        </View>
        <View style={s.main}>
          <Text style={s.name}>{personal.fullName}</Text>
          <Text>{personal.jobTitle}</Text>
          <View style={s.rule} />
          {hasVisibleText(personal.summary) && (
            <View>
              <Text style={s.h}>Professional Summary</Text>
              {richTextToPdf(personal.summary, { color: "#6B7280", fontSize: 9 })}
            </View>
          )}
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.company || job.jobTitle}</Text>
              <Text style={{ color: "#6B7280" }}>{range(job.startDate, job.endDate, job.current)}</Text>
              {richTextToPdf(job.description, { color: "#6B7280", fontSize: 9 })}
            </View>
          ))}
          {includeReferences && references.slice(0, 2).map((r) => (
            <Text key={r.id}>{r.name} — {r.company}</Text>
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10 },
    side: { width: "34%", backgroundColor: sidebar, color: "#fff", padding: 12, gap: 8 },
    photo: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", objectFit: "cover", marginBottom: 8 },
    ribbon: { backgroundColor: ribbon, color: "#fff", textAlign: "center", padding: 5, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginVertical: 4 },
    main: { flex: 1, padding: 16, gap: 8 },
    bar: { backgroundColor: ribbon, color: "#fff", textAlign: "center", padding: 6, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? <Image src={personal.photoUrl} style={s.photo} /> : null}
          <Text style={s.ribbon}>Professional Summary</Text>
          {hasVisibleText(personal.summary) ? richTextToPdf(personal.summary, { color: "#fff", fontSize: 8 }) : null}
          <Text style={s.ribbon}>Skills</Text>
          {skills.map((sk) => <Text key={sk.id}>• {sk.name}</Text>)}
          <Text style={s.ribbon}>Contact Me</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
        </View>
        <View style={s.main}>
          <Text style={{ fontSize: 22, fontWeight: 700 }}>{personal.fullName}</Text>
          <Text style={{ textTransform: "uppercase", letterSpacing: 2 }}>{personal.jobTitle}</Text>
          <Text style={s.bar}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 700 }}>{edu.degree || edu.school}</Text>
              <Text>{range(edu.startDate, edu.endDate, edu.current)}</Text>
            </View>
          ))}
          <Text style={s.bar}>Work Experience</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
              <Text>{[job.company, range(job.startDate, job.endDate, job.current)].filter(Boolean).join(" | ")}</Text>
              {richTextToPdf(job.description, { color: "#444", fontSize: 9 })}
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#111827" },
    side: { width: "34%", backgroundColor: sidebar, color: "#fff" },
    photo: { width: "100%", height: 160, objectFit: "cover" },
    sidePad: { padding: 12, gap: 8 },
    main: { flex: 1, padding: 16, gap: 10 },
    h: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {c.showPhoto && personal.photoUrl ? <Image src={personal.photoUrl} style={s.photo} /> : null}
          <View style={s.sidePad}>
            <Text style={{ fontSize: 16, fontWeight: 700 }}>{personal.fullName}</Text>
            <Text style={{ textTransform: "uppercase", fontSize: 9 }}>{personal.jobTitle}</Text>
            {personal.email ? <Text>{personal.email}</Text> : null}
            {personal.phone ? <Text>{personal.phone}</Text> : null}
            {languages.map((l) => <Text key={l.id}>{l.name}</Text>)}
          </View>
        </View>
        <View style={s.main}>
          {hasVisibleText(personal.summary) && (
            <View>
              <Text style={s.h}>Professional Summary</Text>
              {richTextToPdf(personal.summary, { color: "#4B5563", fontSize: 9 })}
            </View>
          )}
          <Text style={s.h}>Work Experience</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
              <Text style={{ color: "#6B7280" }}>{range(job.startDate, job.endDate, job.current)} · {job.company}</Text>
              {richTextToPdf(job.description, { color: "#4B5563", fontSize: 9 })}
            </View>
          ))}
          <Text style={s.h}>Expertise</Text>
          {skills.map((sk) => <Text key={sk.id}>• {sk.name}</Text>)}
          {education.map((edu) => (
            <View key={edu.id}>
              <Text style={{ fontWeight: 700 }}>{edu.school}</Text>
              <Text>{range(edu.startDate, edu.endDate, edu.current)}</Text>
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const parts = (personal.fullName || "").trim().split(/\s+/);
  const s = StyleSheet.create({
    page: { flexDirection: "row", fontFamily: font, fontSize: 10, color: "#111827", paddingTop: 20 },
    side: { width: "34%", backgroundColor: navy, color: "#fff", padding: 12, marginTop: 60, borderTopRightRadius: 40, gap: 8 },
    main: { flex: 1, paddingHorizontal: 16, gap: 8 },
    name: { color: navy, fontSize: 22, fontWeight: 700, textTransform: "uppercase" },
    pill: { borderWidth: 1, borderColor: navy, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, color: navy, fontSize: 9, fontWeight: 700, textTransform: "uppercase", alignSelf: "flex-start", marginBottom: 4 },
  });
  return (
    <Document>
      <Page size={c.pageFormat === "letter" ? "LETTER" : "A4"} style={s.page}>
        <View style={s.side}>
          {hasVisibleText(personal.summary) ? richTextToPdf(personal.summary, { color: "#fff", fontSize: 8 }) : null}
          <Text style={{ fontWeight: 700 }}>Contact</Text>
          {personal.phone ? <Text>{personal.phone}</Text> : null}
          {personal.email ? <Text>{personal.email}</Text> : null}
          {skills.map((sk) => <Text key={sk.id}>• {sk.name}</Text>)}
          {languages.map((l) => <Text key={l.id}>{l.name}</Text>)}
        </View>
        <View style={s.main}>
          <Text style={{ color: navy }}>{parts[0]}</Text>
          <Text style={s.name}>{parts.slice(1).join(" ") || parts[0]}</Text>
          <Text>{personal.jobTitle}</Text>
          <Text style={s.pill}>Work Experience</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{job.company}</Text>
              <Text>{job.jobTitle} · {range(job.startDate, job.endDate, job.current)}</Text>
              {richTextToPdf(job.description, { color: "#6B7280", fontSize: 9 })}
            </View>
          ))}
          <Text style={s.pill}>Education</Text>
          {education.map((edu) => (
            <Text key={edu.id}>{edu.school} — {range(edu.startDate, edu.endDate, edu.current)}</Text>
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
  const font = pdfFontFamily(c.fontFamily);
  const jobs = experience.length > 0 ? experience : noExperience.map((n) => ({
    id: n.id, jobTitle: n.title, company: n.subtitle, startDate: n.startDate, endDate: n.endDate, current: n.current, description: n.description, location: "",
  }));
  const s = StyleSheet.create({
    page: { fontFamily: font, fontSize: 10, color: "#111827", padding: 32, paddingLeft: 40 },
    accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: accent },
    name: { fontSize: 24, fontWeight: 700, textTransform: "uppercase" },
    title: { color: accent, textTransform: "uppercase", letterSpacing: 2, marginTop: 4, marginBottom: 8 },
    h: { color: accent, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 10, marginBottom: 4 },
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
            <Text style={s.h}>Professional Summary</Text>
            {richTextToPdf(personal.summary, { color: "#6B7280", fontSize: 9 })}
          </View>
        )}
        <Text style={s.h}>Work Experience</Text>
        {jobs.map((job) => (
          <View key={job.id} style={{ marginBottom: 6 }}>
            <Text style={{ fontWeight: 700 }}>{job.jobTitle}</Text>
            <Text style={{ color: "#6B7280" }}>{job.company} · {range(job.startDate, job.endDate, job.current)}</Text>
            {richTextToPdf(job.description, { color: "#6B7280", fontSize: 9 })}
          </View>
        ))}
        <Text style={s.h}>Education</Text>
        {education.map((edu) => (
          <Text key={edu.id}>{edu.school} — {range(edu.startDate, edu.endDate, edu.current)}</Text>
        ))}
        <Text style={s.h}>Skills</Text>
        <Text>{skills.map((sk) => sk.name).join("  ·  ")}</Text>
        {languages.length > 0 && (
          <View>
            <Text style={s.h}>Languages</Text>
            <Text>{languages.map((l) => l.name).join("  ·  ")}</Text>
          </View>
        )}
        {includeReferences && references.length > 0 && (
          <View>
            <Text style={s.h}>References</Text>
            {references.slice(0, 2).map((r) => (
              <Text key={r.id}>{r.name}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
