import { create } from "zustand";
import type {
  Resume,
  PersonalInfo,
  ExperienceItem,
  NoExperienceItem,
  EducationItem,
  SkillItem,
  LanguageItem,
  Customization,
} from "../types/resume";
import { emptyResume } from "../types/resume";

/** Generates ids for list items (experience entries, skills, ...) */
export const uid = () => crypto.randomUUID();

interface ResumeState {
  resume: Resume;
  /** true when there are changes not yet saved to Supabase */
  dirty: boolean;

  setResume: (resume: Resume) => void;
  resetResume: () => void;
  setTitle: (title: string) => void;
  markSaved: (id?: string) => void;

  updatePersonal: (patch: Partial<PersonalInfo>) => void;
  updateCustomization: (patch: Partial<Customization>) => void;

  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  /** Move the entry with dragId to the position of overId */
  reorderExperience: (dragId: string, overId: string) => void;
  setExperienceChoice: (choice: Resume["experienceChoice"]) => void;

  addNoExperience: () => void;
  updateNoExperience: (id: string, patch: Partial<NoExperienceItem>) => void;
  removeNoExperience: (id: string) => void;
  reorderNoExperience: (dragId: string, overId: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;

  addSkill: (name?: string) => void;
  updateSkill: (id: string, patch: Partial<SkillItem>) => void;
  removeSkill: (id: string) => void;

  addLanguage: (name?: string) => void;
  updateLanguage: (id: string, patch: Partial<LanguageItem>) => void;
  removeLanguage: (id: string) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resume: emptyResume,
  dirty: false,

  setResume: (resume) => set({ resume, dirty: false }),
  resetResume: () => set({ resume: emptyResume, dirty: false }),
  setTitle: (title) =>
    set((s) => ({ resume: { ...s.resume, title }, dirty: true })),
  markSaved: (id) =>
    set((s) => ({
      resume: id ? { ...s.resume, id } : s.resume,
      dirty: false,
    })),

  updatePersonal: (patch) =>
    set((s) => ({
      resume: { ...s.resume, personal: { ...s.resume.personal, ...patch } },
      dirty: true,
    })),

  updateCustomization: (patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        customization: { ...s.resume.customization, ...patch },
      },
      dirty: true,
    })),

  /* ---------- experience ---------- */
  addExperience: () =>
    set((s) => ({
      resume: {
        ...s.resume,
        experience: [
          ...s.resume.experience,
          {
            id: uid(),
            jobTitle: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
          },
        ],
      },
      dirty: true,
    })),
  updateExperience: (id, patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        experience: s.resume.experience.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      },
      dirty: true,
    })),
  removeExperience: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        experience: s.resume.experience.filter((e) => e.id !== id),
      },
      dirty: true,
    })),
  reorderExperience: (dragId, overId) =>
    set((s) => {
      if (dragId === overId) return s;
      const list = [...s.resume.experience];
      const from = list.findIndex((e) => e.id === dragId);
      const to = list.findIndex((e) => e.id === overId);
      if (from === -1 || to === -1) return s;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { resume: { ...s.resume, experience: list }, dirty: true };
    }),
  setExperienceChoice: (choice) =>
    set((s) => ({
      resume: { ...s.resume, experienceChoice: choice },
      dirty: true,
    })),

  /* ---------- no experience (fresh graduate) ---------- */
  addNoExperience: () =>
    set((s) => ({
      resume: {
        ...s.resume,
        noExperience: [
          ...s.resume.noExperience,
          {
            id: uid(),
            type: "university",
            title: "",
            subtitle: "",
            url: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
          },
        ],
      },
      dirty: true,
    })),
  updateNoExperience: (id, patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        noExperience: s.resume.noExperience.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      },
      dirty: true,
    })),
  removeNoExperience: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        noExperience: s.resume.noExperience.filter((e) => e.id !== id),
      },
      dirty: true,
    })),
  reorderNoExperience: (dragId, overId) =>
    set((s) => {
      if (dragId === overId) return s;
      const list = [...s.resume.noExperience];
      const from = list.findIndex((e) => e.id === dragId);
      const to = list.findIndex((e) => e.id === overId);
      if (from === -1 || to === -1) return s;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { resume: { ...s.resume, noExperience: list }, dirty: true };
    }),

  /* ---------- education ---------- */
  addEducation: () =>
    set((s) => ({
      resume: {
        ...s.resume,
        education: [
          ...s.resume.education,
          {
            id: uid(),
            school: "",
            degree: "",
            field: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
          },
        ],
      },
      dirty: true,
    })),
  updateEducation: (id, patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        education: s.resume.education.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      },
      dirty: true,
    })),
  removeEducation: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        education: s.resume.education.filter((e) => e.id !== id),
      },
      dirty: true,
    })),

  /* ---------- skills ---------- */
  addSkill: (name = "") =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: [
          ...s.resume.skills,
          { id: uid(), name, level: "intermediate" },
        ],
      },
      dirty: true,
    })),
  updateSkill: (id, patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: s.resume.skills.map((sk) =>
          sk.id === id ? { ...sk, ...patch } : sk,
        ),
      },
      dirty: true,
    })),
  removeSkill: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: s.resume.skills.filter((sk) => sk.id !== id),
      },
      dirty: true,
    })),

  /* ---------- languages ---------- */
  addLanguage: (name = "") =>
    set((s) => ({
      resume: {
        ...s.resume,
        languages: [
          ...s.resume.languages,
          { id: uid(), name, level: "conversational" },
        ],
      },
      dirty: true,
    })),
  updateLanguage: (id, patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        languages: s.resume.languages.map((l) =>
          l.id === id ? { ...l, ...patch } : l,
        ),
      },
      dirty: true,
    })),
  removeLanguage: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        languages: s.resume.languages.filter((l) => l.id !== id),
      },
      dirty: true,
    })),
}));
