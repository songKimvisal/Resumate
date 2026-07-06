/** The complete resume data model.
 *  Stored in Zustand while editing and saved to Supabase as one jsonb column. */

/** A single entry in a repeatable link field: a display title (shown on the
 *  resume) plus the URL it links to (not shown, only used as the href). */
export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

/** How the uploaded photo fills its circular frame — same idea as Figma's
 *  image fill modes. "crop" additionally lets the user pan/zoom, stored in
 *  photoZoom / photoPosition (percent offset from center, so they scale to
 *  any frame size). */
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
  /** pan offset in percent from center, only used when photoFit is "crop" */
  photoPosition: { x: number; y: number };
  summary: string;
  /* optional "Add details" fields */
  nationality: string;
  /** repeatable link fields — a user may list more than one of each */
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
  startDate: string; // "2023-06" (month input format)
  endDate: string; // "" while current
  current: boolean;
  description: string; // bullet points, one per line
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface LanguageItem {
  id: string;
  name: string;
  level: "basic" | "conversational" | "fluent" | "native";
}

export interface Customization {
  template: string; // template id, e.g. "classic"
  accentColor: string; // hex
  fontSize: "small" | "medium" | "large";
}

export interface Resume {
  id: string | null; // Supabase row id (null until first save)
  title: string; // internal name, e.g. "Bank teller resume"
  personal: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  customization: Customization;
}

export const emptyResume: Resume = {
  id: null,
  title: "Untitled resume",
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
  education: [],
  skills: [],
  languages: [],
  customization: {
    template: "classic",
    accentColor: "#C1121F",
    fontSize: "medium",
  },
};
