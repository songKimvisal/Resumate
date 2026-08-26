import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Resume,
  PersonalInfo,
  ExperienceItem,
  NoExperienceItem,
  NoExperienceType,
  EducationItem,
  SkillItem,
  LanguageItem,
  ReferenceItem,
  Customization,
} from "../types/resume";
import { emptyResume, createEmptyResume } from "../types/resume";
import {
  moveIdBefore,
  resolveExperienceOrder,
} from "../lib/experienceOrder";

/** Generates ids for list items (experience entries, skills, ...) */
export const uid = () => crypto.randomUUID();

// resumes saved before fontSize became a plain px number stored it as this
// enum - convert on load so old saves don't end up with a non-numeric size
const LEGACY_FONT_SIZE_PX: Record<string, number> = {
  small: 13,
  medium: 14.5,
  large: 16,
};
function normalizeFontSize(fontSize: unknown): number | undefined {
  if (typeof fontSize === "string") return LEGACY_FONT_SIZE_PX[fontSize];
  if (typeof fontSize === "number") return fontSize;
  return undefined;
}

interface ResumeState {
  resume: Resume;
  /** true when there are changes not yet saved to Supabase */
  dirty: boolean;

  setResume: (resume: Resume) => void;
  resetResume: () => void;
  setTitle: (title: string) => void;
  markSaved: (id?: string) => void;
  setBuilderStep: (step: number) => void;

  updatePersonal: (patch: Partial<PersonalInfo>) => void;
  updateCustomization: (patch: Partial<Customization>) => void;
  /** Start a blank resume on a new template. Does not copy previous content. */
  startResumeFromTemplate: (
    customization: Partial<Customization>,
    title: string,
  ) => void;

  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  /** Move the entry with dragId to the position of overId */
  reorderExperience: (dragId: string, overId: string) => void;
  /** Reorder jobs and internships/projects as one list. */
  reorderExperienceList: (dragId: string, overId: string) => void;
  setExperienceChoice: (choice: Resume["experienceChoice"]) => void;

  addNoExperience: (type?: NoExperienceType) => void;
  updateNoExperience: (id: string, patch: Partial<NoExperienceItem>) => void;
  removeNoExperience: (id: string) => void;
  reorderNoExperience: (dragId: string, overId: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (dragId: string, overId: string) => void;

  addSkill: (name?: string) => void;
  updateSkill: (id: string, patch: Partial<SkillItem>) => void;
  removeSkill: (id: string) => void;

  addLanguage: (name?: string) => void;
  updateLanguage: (id: string, patch: Partial<LanguageItem>) => void;
  removeLanguage: (id: string) => void;

  addReference: () => void;
  updateReference: (id: string, patch: Partial<ReferenceItem>) => void;
  removeReference: (id: string) => void;
  setIncludeReferences: (value: boolean) => void;
}

function currentExperienceOrder(resume: Resume) {
  return resolveExperienceOrder(
    resume.experience.map((item) => item.id),
    resume.noExperience.map((item) => item.id),
    resume.experienceOrder,
  );
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
  resume: emptyResume,
  dirty: false,

  // backfills any customization fields missing from resumes saved before
  // they existed, so older resumes don't silently break newer styling
  // options (e.g. a saved pageBorder=true with no pageBorderWidth yet)
  setResume: (resume) =>
    set({
      resume: {
        ...resume,
        customization: {
          ...emptyResume.customization,
          ...resume.customization,
          fontSize:
            normalizeFontSize(resume.customization?.fontSize) ??
            emptyResume.customization.fontSize,
        },
      },
      dirty: false,
    }),
  resetResume: () => set({ resume: createEmptyResume(), dirty: false }),
  setTitle: (title) =>
    set((s) => ({ resume: { ...s.resume, title }, dirty: true })),
  setBuilderStep: (step) =>
    set((s) =>
      s.resume.builderStep === step
        ? s
        : { resume: { ...s.resume, builderStep: step }, dirty: true },
    ),
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
  startResumeFromTemplate: (customization, title) =>
    set({
      resume: {
        ...createEmptyResume(),
        title,
        customization: {
          ...emptyResume.customization,
          ...customization,
          toggles: {
            ...emptyResume.customization.toggles,
            ...customization.toggles,
          },
        },
      },
      dirty: true,
    }),

  /* ---------- experience ---------- */
  addExperience: () =>
    set((s) => {
      const id = uid();
      return {
        resume: {
          ...s.resume,
          experience: [
            ...s.resume.experience,
            {
              id,
              jobTitle: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
            },
          ],
          experienceOrder: [...currentExperienceOrder(s.resume), id],
        },
        dirty: true,
      };
    }),
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
        experienceOrder: currentExperienceOrder(s.resume).filter(
          (entryId) => entryId !== id,
        ),
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
  reorderExperienceList: (dragId, overId) =>
    set((s) => ({
      resume: {
        ...s.resume,
        experienceOrder: moveIdBefore(
          currentExperienceOrder(s.resume),
          dragId,
          overId,
        ),
      },
      dirty: true,
    })),
  setExperienceChoice: (choice) =>
    set((s) => ({
      resume: { ...s.resume, experienceChoice: choice },
      dirty: true,
    })),

  /* ---------- no experience (fresh graduate) ---------- */
  addNoExperience: (type: NoExperienceType = "university") =>
    set((s) => {
      const id = uid();
      return {
        resume: {
          ...s.resume,
          noExperience: [
            ...s.resume.noExperience,
            {
              id,
              type,
              title: "",
              subtitle: "",
              url: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
            },
          ],
          experienceOrder: [...currentExperienceOrder(s.resume), id],
        },
        dirty: true,
      };
    }),
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
        experienceOrder: currentExperienceOrder(s.resume).filter(
          (entryId) => entryId !== id,
        ),
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
            gpa: "",
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
  reorderEducation: (dragId, overId) =>
    set((s) => {
      if (dragId === overId) return s;
      const list = [...s.resume.education];
      const from = list.findIndex((e) => e.id === dragId);
      const to = list.findIndex((e) => e.id === overId);
      if (from === -1 || to === -1) return s;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { resume: { ...s.resume, education: list }, dirty: true };
    }),

  /* ---------- skills ---------- */
  addSkill: (name = "") =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: [...s.resume.skills, { id: uid(), name, level: 3 }],
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
        languages: [...s.resume.languages, { id: uid(), name, level: 3 }],
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

  /* ---------- references ---------- */
  addReference: () =>
    set((s) => ({
      resume: {
        ...s.resume,
        references: [
          ...s.resume.references,
          {
            id: uid(),
            name: "",
            jobTitle: "",
            company: "",
            email: "",
            phone: "",
          },
        ],
      },
      dirty: true,
    })),
  updateReference: (id, patch) =>
    set((s) => ({
      resume: {
        ...s.resume,
        references: s.resume.references.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      },
      dirty: true,
    })),
  removeReference: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        references: s.resume.references.filter((r) => r.id !== id),
      },
      dirty: true,
    })),
  setIncludeReferences: (value) =>
    set((s) => ({
      resume: { ...s.resume, includeReferences: value },
      dirty: true,
    })),
    }),
    {
      name: "resumate-active-resume",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ resume: s.resume, dirty: s.dirty }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ResumeState> | undefined;
        if (!saved?.resume) return current;
        return {
          ...current,
          ...saved,
          resume: {
            ...saved.resume,
            customization: {
              ...emptyResume.customization,
              ...saved.resume.customization,
              fontSize:
                normalizeFontSize(saved.resume.customization?.fontSize) ??
                emptyResume.customization.fontSize,
            },
          },
        };
      },
    },
  ),
);

export function useResumeStoreHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useResumeStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useResumeStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useResumeStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
