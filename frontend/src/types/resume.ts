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
  fullName: boolean;
  jobTitle: boolean;
  headings: boolean;
  headingsLine: boolean;
  dots: boolean;
  dates: boolean;
  linkIcons: boolean;
  headerIcons: boolean;
  timeline: boolean;
}
export type SectionOrderKey =
  | "skills"
  | "experience"
  | "references"
  | "language";
export type LayoutVariant =
  | "default"
  | "designerBlock"
  | "techSplit"
  | "bankingClean"
  | "freshSidebar"
  | "navyAnalyst"
  | "ribbonFold"
  | "graphicPro"
  | "executiveCard"
  | "monoTimeline"
  | "editorialClassic"
  | "compactTech"
  | "graduateFocus"
  | "corporateBand"
  | "warmColumns"
  | "monoPill"
  | "cleanHeaderSplit";

export interface Customization {
  template: string;
  layoutVariant: LayoutVariant;
  accentColor: string;
  sidebarBgColor: string;
  columns: "one" | "two";
  headerPosition: "left" | "top" | "right";
  fontSize: number;
  fontFamily: string;
  fullNameSize: number;
  titleSize: number;
  headingsSize: number;
  headingBorder: "none" | "outline" | "filled" | "line" | "underline";
  headingsLetterSpacing: number;
  capitalization: "capitalize" | "uppercase";
  bulletStyle: "disc" | "dash" | "arrow" | "square" | "none";
  dateFormat: "monthYear" | "numeric" | "yearOnly";
  linkStyle: ("underline" | "color" | "icon")[];
  sectionIcon: "none" | "outline" | "filled";
  headerAlignment: "left" | "center";
  headerLayout: "stacked" | "row";
  contactArrangement: "inline" | "stacked";
  contactSeparator: "icon" | "bullet" | "bar";
  iconStyle: "plain" | "filled" | "outline" | "square" | "faded";
  bodyTextColor: string;
  bodyBgColor: string;
  showPhoto: boolean;
  photoShape: "circle" | "rounded" | "square";
  photoSize: number;
  photoBorder: boolean;
  sidebarPhotoFill: boolean;
  skillsDisplay: "meter" | "list";
  topAccentBar: boolean;
  footerBar: boolean;
  pageBorder: boolean;
  pageBorderWidth: number;
  pageFormat: "a4" | "letter";
  lineHeight: number;
  elementSpacing: number;
  topBottomMargin: number;
  leftRightMargin: number;
  sectionOrder: SectionOrderKey[];
  sidebarKeys: SectionOrderKey[];
  toggles: CustomizationToggles;
}

export interface Resume {
  id: string | null;
  title: string;
  builderStep?: number;
  experienceChoice: "has" | "none" | null;
  personal: PersonalInfo;
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  experienceOrder?: string[];
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
  experienceOrder: [],
  education: [],
  skills: [],
  languages: [],
  references: [],
  includeReferences: true,
  customization: {
    template: "classic",
    layoutVariant: "default",
    accentColor: "#C1121F",
    sidebarBgColor: "",
    columns: "one",
    headerPosition: "left",
    fontSize: 14.5,
    fontFamily: "Inter",
    fullNameSize: 28,
    titleSize: 17,
    headingsSize: 12,
    headingBorder: "none",
    headingsLetterSpacing: 0,
    capitalization: "uppercase",
    bulletStyle: "disc",
    dateFormat: "monthYear",
    linkStyle: ["underline"],
    sectionIcon: "none",
    headerAlignment: "center",
    headerLayout: "stacked",
    contactArrangement: "inline",
    contactSeparator: "icon",
    iconStyle: "plain",
    bodyTextColor: "#171717",
    bodyBgColor: "#ffffff",
    showPhoto: true,
    photoShape: "circle",
    photoSize: 80,
    photoBorder: false,
    sidebarPhotoFill: false,
    skillsDisplay: "meter",
    topAccentBar: false,
    footerBar: false,
    pageBorder: false,
    pageBorderWidth: 1.5,
    pageFormat: "a4",
    lineHeight: 1.5,
    elementSpacing: 12,
    topBottomMargin: 6,
    leftRightMargin: 6,
    sectionOrder: ["skills", "experience", "references", "language"],
    sidebarKeys: ["skills", "references", "language"],
    toggles: {
      fullName: false,
      jobTitle: true,
      headings: true,
      headingsLine: true,
      dots: true,
      dates: true,
      linkIcons: true,
      headerIcons: true,
      timeline: false,
    },
  },
};

export function createEmptyResume(): Resume {
  return structuredClone(emptyResume);
}
