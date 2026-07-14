import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  NO_EXPERIENCE_TYPE_LABELS,
  type EducationItem,
  type ExperienceItem,
  type Resume,
} from "../../../types/resume";
import { richTextToPdf, hasVisibleText } from "../../../lib/richTextToPdf";

const BASE_SIZE = { small: 9, medium: 10, large: 11 } as const;

/** Formats "2023-06" → "Jun 2023" */
function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function dateRange(
  item: Pick<ExperienceItem | EducationItem, "startDate" | "endDate" | "current">,
) {
  if (!item.startDate && !item.endDate && !item.current) return "";
  const end = item.current ? "Present" : fmtDate(item.endDate);
  return `${fmtDate(item.startDate)} – ${end}`;
}

/** Real A4 page (595.28 × 841.89pt) via @react-pdf/renderer. Entries use
 *  `wrap={false}` so a page break never lands mid-entry. */
export function ResumeDocument({ resume }: { resume: Resume }) {
  const {
    personal,
    experience,
    noExperience,
    education,
    skills,
    languages,
    customization,
  } = resume;
  const accent = customization.accentColor;
  const base = BASE_SIZE[customization.fontSize];

  const styles = StyleSheet.create({
    page: {
      paddingVertical: "7%",
      paddingHorizontal: "7%",
      fontSize: base,
      fontFamily: "Helvetica",
      color: "#262626",
    },
    header: { alignItems: "center", marginBottom: 14 },
    photo: {
      width: 64,
      height: 64,
      borderRadius: 32,
      marginBottom: 8,
      objectFit: "cover",
    },
    name: { fontSize: base * 1.9, fontFamily: "Helvetica-Bold" },
    jobTitle: { fontSize: base * 1.15, fontFamily: "Helvetica-Bold", marginTop: 2 },
    contactRow: {
      fontSize: base * 0.8,
      color: "#525252",
      marginTop: 6,
      textAlign: "center",
    },
    section: { marginTop: 14 },
    sectionTitle: {
      fontSize: base * 0.8,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      paddingBottom: 3,
      marginBottom: 6,
      borderBottomWidth: 1,
    },
    entry: { marginTop: 8 },
    entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontSize: base * 0.95, fontFamily: "Helvetica-Bold" },
    entryMeta: { fontFamily: "Helvetica", color: "#525252" },
    entryDates: { fontSize: base * 0.78, color: "#737373" },
    entrySubtitle: { fontSize: base * 0.85, color: "#525252", marginTop: 1 },
    twoCol: { flexDirection: "row", marginTop: 14, gap: 24 },
    col: { flex: 1 },
  });

  const contactParts = [
    personal.phone,
    personal.email,
    personal.location,
    personal.nationality,
    ...personal.portfolio.map((l) => l.title).filter(Boolean),
    ...personal.website.map((l) => l.title).filter(Boolean),
    ...personal.linkedin.map((l) => l.title).filter(Boolean),
    ...personal.github.map((l) => l.title).filter(Boolean),
    ...personal.gitlab.map((l) => l.title).filter(Boolean),
    ...personal.stackoverflow.map((l) => l.title).filter(Boolean),
    ...personal.telegram.map((l) => l.title).filter(Boolean),
    personal.passportId,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          {personal.photoUrl && (
            <Image src={personal.photoUrl} style={styles.photo} />
          )}
          <Text style={styles.name}>{personal.fullName || "Your Name"}</Text>
          <Text style={[styles.jobTitle, { color: accent }]}>
            {personal.jobTitle || "Job Title"}
          </Text>
          {contactParts.length > 0 && (
            <Text style={styles.contactRow}>{contactParts.join("   ·   ")}</Text>
          )}
        </View>

        {hasVisibleText(personal.summary) && (
          <View style={styles.section} minPresenceAhead={40}>
            <Text style={[styles.sectionTitle, { color: accent, borderColor: accent }]}>
              Summary
            </Text>
            {richTextToPdf(personal.summary, {
              fontSize: base * 0.9,
              color: "#404040",
            })}
          </View>
        )}

        {experience.length > 0 && (
          <View style={styles.section} minPresenceAhead={40}>
            <Text style={[styles.sectionTitle, { color: accent, borderColor: accent }]}>
              Experience
            </Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {exp.jobTitle || "Job title"}
                    {(exp.company || exp.location) && (
                      <Text style={styles.entryMeta}>
                        {" "}— {[exp.company, exp.location].filter(Boolean).join(", ")}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.entryDates}>{dateRange(exp)}</Text>
                </View>
                {hasVisibleText(exp.description) &&
                  richTextToPdf(exp.description, {
                    fontSize: base * 0.85,
                    color: "#404040",
                  })}
              </View>
            ))}
          </View>
        )}

        {experience.length === 0 && noExperience.length > 0 && (
          <View style={styles.section} minPresenceAhead={40}>
            <Text style={[styles.sectionTitle, { color: accent, borderColor: accent }]}>
              Experience
            </Text>
            {noExperience.map((exp) => (
              <View key={exp.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {NO_EXPERIENCE_TYPE_LABELS[exp.type]}
                    {(exp.title || exp.subtitle) && (
                      <Text style={styles.entryMeta}>
                        {" "}
                        — {[exp.title, exp.subtitle].filter(Boolean).join(", ")}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.entryDates}>{dateRange(exp)}</Text>
                </View>
                {hasVisibleText(exp.description) &&
                  richTextToPdf(exp.description, {
                    fontSize: base * 0.85,
                    color: "#404040",
                  })}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section} minPresenceAhead={40}>
            <Text style={[styles.sectionTitle, { color: accent, borderColor: accent }]}>
              Education
            </Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <View>
                    <Text style={styles.entryTitle}>
                      {[edu.degree, edu.field].filter(Boolean).join(" in ") ||
                        "Degree"}
                    </Text>
                    <Text style={styles.entrySubtitle}>{edu.school}</Text>
                  </View>
                  <Text style={styles.entryDates}>{dateRange(edu)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {(skills.length > 0 || languages.length > 0) && (
          <View style={styles.twoCol} wrap={false}>
            {skills.length > 0 && (
              <View style={styles.col}>
                <Text style={[styles.sectionTitle, { color: accent, borderColor: accent }]}>
                  Skills
                </Text>
                <Text style={{ fontSize: base * 0.85 }}>
                  {skills.map((s) => s.name).filter(Boolean).join("  ·  ")}
                </Text>
              </View>
            )}
            {languages.length > 0 && (
              <View style={styles.col}>
                <Text style={[styles.sectionTitle, { color: accent, borderColor: accent }]}>
                  Languages
                </Text>
                <Text style={{ fontSize: base * 0.85 }}>
                  {languages
                    .map((l) => (l.name ? `${l.name} (${l.level})` : ""))
                    .filter(Boolean)
                    .join("  ·  ")}
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
