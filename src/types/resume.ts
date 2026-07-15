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

/** 1 (lowest) - 5 (highest) proficiency, shown as a 5-dot rating */
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

/** 1 (lowest) - 5 (highest) proficiency, shown as a 5-dot rating */
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

export interface Customization {
  template: string; 
  accentColor: string; 
  fontSize: "small" | "medium" | "large";
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
    fontSize: "medium",
  },
};
