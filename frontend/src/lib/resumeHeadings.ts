import type { Customization, NoExperienceType } from "../types/resume";

export type ResumeHeadingLang = "en" | "km";

const KM_HEADINGS: Record<string, string> = {
  Contact: "ទំនាក់ទំនង",
  Skills: "ជំនាញ",
  "Technical Skills": "ជំនាញបច្ចេកទេស",
  "Core Skills": "ជំនាញសំខាន់",
  Languages: "ភាសា",
  Language: "ភាសា",
  "About Me": "អំពីខ្ញុំ",
  About: "អំពីខ្ញុំ",
  Education: "ការសិក្សា",
  "Work Experience": "បទពិសោធន៍ការងារ",
  Experience: "បទពិសោធន៍ការងារ",
  "Experience & Projects": "បទពិសោធន៍ និងគម្រោង",
  References: "អ្នកធានា",
  Reference: "អ្នកធានា",
  "Professional Summary": "សេចក្តីសង្ខេប",
  Summary: "សេចក្តីសង្ខេប",
  Profile: "ប្រវត្តិរូប",
  Expertise: "ជំនាញ",
};

const KM_NO_EXP: Record<NoExperienceType, string> = {
  university: "គម្រោងសាកលវិទ្យាល័យ",
  volunteer: "ការងារស្ម័គ្រចិត្ត",
  competition: "ការប្រកួត",
  internship: "កម្មសិក្សា",
  partTime: "ការងារក្រៅម៉ោង",
};

const KM_SKILL_LEVELS = ["ថ្មីថ្មោង", "មូលដ្ឋាន", "មធ្យម", "ខ្ពស់", "អ្នកជំនាញ"];
const KM_LANG_LEVELS = ["មូលដ្ឋាន", "បឋម", "និយាយបាន", "ស្ទាត់", "ភាសាកំណើត"];

export function headingLang(
  customization?: Pick<Customization, "headingLanguage"> | null,
): ResumeHeadingLang {
  return customization?.headingLanguage === "km" ? "km" : "en";
}

export function resumeHeading(
  title: string,
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  if (headingLang(customization) !== "km") return title;
  return KM_HEADINGS[title] ?? title;
}

export function resumePresent(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? "បច្ចុប្បន្ន" : "Present";
}

export function resumeNoExpType(
  type: NoExperienceType,
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  if (headingLang(customization) === "km") return KM_NO_EXP[type];
  return "";
}

export function resumeSkillLevel(
  index: number,
  customization?: Pick<Customization, "headingLanguage"> | null,
  english = "",
): string {
  if (headingLang(customization) !== "km") return english;
  return KM_SKILL_LEVELS[index] ?? english;
}

export function resumeLanguageLevel(
  index: number,
  customization?: Pick<Customization, "headingLanguage"> | null,
  english = "",
): string {
  if (headingLang(customization) !== "km") return english;
  return KM_LANG_LEVELS[index] ?? english;
}

export function resumeDateLocale(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? "km-KH" : "en-US";
}

const KHMER_RE = /[\u1780-\u17FF\u19E0-\u19FF]/;

export function hasKhmerScript(text: string | undefined | null): boolean {
  return !!text && KHMER_RE.test(text);
}

export function resumeGpaLabel(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? "មធ្យមភាគ" : "GPA";
}

export function resumeDegreeJoin(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? " — " : " in ";
}

export function resumeDegreeFallback(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? "សញ្ញាបត្រ" : "Degree";
}

export function resumeNameFallback(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? "ឈ្មោះរបស់អ្នក" : "Your Name";
}

export function resumeTitleFallback(
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  return headingLang(customization) === "km" ? "តួនាទីការងារ" : "Job Title";
}

/** True when headings are Khmer or any resume field contains Khmer letters. */
export function resumeNeedsKhmerFont(resume: {
  customization?: Pick<Customization, "headingLanguage"> | null;
  personal?: unknown;
  experience?: unknown;
  noExperience?: unknown;
  education?: unknown;
  skills?: unknown;
  languages?: unknown;
  references?: unknown;
}): boolean {
  if (headingLang(resume.customization) === "km") return true;
  return KHMER_RE.test(
    JSON.stringify({
      personal: resume.personal,
      experience: resume.experience,
      noExperience: resume.noExperience,
      education: resume.education,
      skills: resume.skills,
      languages: resume.languages,
      references: resume.references,
    }),
  );
}

export function resumeSheetLang(
  customization?: Pick<Customization, "headingLanguage"> | null,
): "km" | "en" {
  return headingLang(customization);
}
