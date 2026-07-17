export interface LinkItem {
  id: string;
  title: string;
  url: string;
}
export type PhotoFit = "fill" | "fit" | "crop";
export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  photoUrl: string;
  photoFit: PhotoFit;
  photoZoom: number;
  photoPosition: { x: number; y: number };
  summary: string;
  nationality: string;
  portfolio: LinkItem[];
  linkedin: LinkItem[];
  website: LinkItem[];
  passportId: string;
  github: LinkItem[];
  stackoverflow: LinkItem[];
  gitlab: LinkItem[];
  telegram: LinkItem[];
}

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string; 
  endDate: string;
  current: boolean;
  description: string; 
}
export type NoExperienceType =
  | "university"
  | "volunteer"
  | "competition"
  | "internship"
  | "partTime";
export const NO_EXPERIENCE_TYPE_LABELS: Record<NoExperienceType, string> = {
  university: "University Project",
  volunteer: "Volunteer Work",
  competition: "Competition",
  internship: "Internship",
  partTime: "Part-time Job",
};

export interface NoExperienceItem {
  id: string;
  type: NoExperienceType;
  title: string;
  subtitle: string;
  url: string;
  startDate: string; 
  endDate: string; 
  current: boolean;
  description: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number;
}
export const SKILL_LEVEL_LABELS = [
  "Beginner",
  "Novice",
  "Intermediate",
  "Advanced",
  "Expert",
];


export interface LanguageItem {
  id: string;
  name: string;
  level: number;
}
export const LANGUAGE_LEVEL_LABELS = [
  "Basic",
  "Elementary",
  "Conversational",
  "Fluent",
  "Native",
];

export interface ReferenceItem {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
}

export interface CustomizationToggles {
  jobTitle: boolean;
  headings: boolean;
  headingsLine: boolean;
  dots: boolean;
  dates: boolean;
  linkIcons: boolean;
  headerIcons: boolean;
}
export type SectionOrderKey = "skills" | "experience" | "references" | "language";

export interface Customization {
  template: string;
  accentColor: string;
  columns: "one" | "two";
  headerPosition: "left" | "top" | "right";
  fontSize: "small" | "medium" | "large";
  fontFamily: string;
  fullNameSize: number;
  titleSize: number;
  headingsSize: number;
  headingBorder: "none" | "outline" | "filled";
  capitalization: "capitalize" | "uppercase";
  linkStyle: "underline" | "color" | "icon";
  headingTextColor: string;
  headingBgColor: string;
  bodyTextColor: string;
  bodyBgColor: string;
  bodyAccentColor: string;
  colorLayout: "column" | "full" | "border";
  paletteMode: "single" | "multi";
  showPhoto: boolean;
  photoShape: "circle" | "rounded" | "square";
  photoSize: number;
  pageFormat: "a4" | "letter";
  lineHeight: number;
  elementSpacing: number;
  topBottomMargin: number;
  leftRightMargin: number;
  sectionOrder: SectionOrderKey[];
  toggles: CustomizationToggles;
}

export interface Resume {
  id: string | null; 
  title: string; 
  /** Step 2 entry choice: has experience, none (fresh graduate), or not asked yet */
  experienceChoice: "has" | "none" | null;
  personal: PersonalInfo;
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  references: ReferenceItem[];
  includeReferences: boolean;
  customization: Customization;
}

export const emptyResume: Resume = {
  id: null,
  title: "Untitled resume",
  experienceChoice: null,
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    photoUrl: "",
    photoFit: "fill",
    photoZoom: 1,
    photoPosition: { x: 0, y: 0 },
    summary: "",
    nationality: "",
    portfolio: [],
    linkedin: [],
    website: [],
    passportId: "",
    github: [],
    stackoverflow: [],
    gitlab: [],
    telegram: [],
  },
  experience: [],
  noExperience: [],
  education: [],
  skills: [],
  languages: [],
  references: [],
  includeReferences: true,
  customization: {
    template: "classic",
    accentColor: "#C1121F",
    columns: "one",
    headerPosition: "left",
    fontSize: "medium",
    fontFamily: "Inter",
    fullNameSize: 28,
    titleSize: 17,
    headingsSize: 12,
    headingBorder: "none",
    capitalization: "uppercase",
    linkStyle: "underline",
    headingTextColor: "#262626",
    headingBgColor: "#ffffff",
    bodyTextColor: "#262626",
    bodyBgColor: "#ffffff",
    bodyAccentColor: "#737373",
    colorLayout: "column",
    paletteMode: "multi",
    showPhoto: true,
    photoShape: "circle",
    photoSize: 80,
    pageFormat: "a4",
    lineHeight: 1.5,
    elementSpacing: 12,
    topBottomMargin: 6,
    leftRightMargin: 6,
    sectionOrder: ["skills", "experience", "references", "language"],
    toggles: {
      jobTitle: true,
      headings: true,
      headingsLine: true,
      dots: true,
      dates: true,
      linkIcons: true,
      headerIcons: true,
    },
  },
};
