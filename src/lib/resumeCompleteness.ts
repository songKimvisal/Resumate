import type { Resume } from "../types/resume";

export type ScoreBand = "excellent" | "strong" | "good" | "needsWork";

export interface ChecklistItem {
  id: string;
  step: number;
  weight: number;
  done: boolean;
}

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function buildChecklist(resume: Resume): ChecklistItem[] {
  const { personal, experienceChoice, experience, noExperience, education, skills } =
    resume;

  const hasExperience =
    experienceChoice === "has"
      ? experience.length > 0
      : experienceChoice === "none"
        ? noExperience.length > 0
        : false;

  const items: ChecklistItem[] = [
    { id: "fullName", step: 1, weight: 10, done: !!personal.fullName.trim() },
    { id: "jobTitle", step: 1, weight: 10, done: !!personal.jobTitle.trim() },
    {
      id: "contact",
      step: 1,
      weight: 15,
      done:
        isValidEmail(personal.email) &&
        !!personal.phone.trim() &&
        !!personal.location.trim(),
    },
    { id: "summary", step: 1, weight: 10, done: !!personal.summary.trim() },
    { id: "experience", step: 2, weight: 20, done: hasExperience },
    { id: "education", step: 3, weight: 15, done: education.length > 0 },
    { id: "skills", step: 4, weight: 15, done: skills.length > 0 },
  ];

  if (resume.customization.showPhoto) {
    items.push({
      id: "photo",
      step: 1,
      weight: 5,
      done: !!personal.photoUrl,
    });
  }

  return items;
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 100) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 50) return "good";
  return "needsWork";
}

export function computeCompleteness(resume: Resume) {
  const items = buildChecklist(resume);
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const doneWeight = items.reduce(
    (sum, item) => sum + (item.done ? item.weight : 0),
    0,
  );
  const score = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
  const missing = items.filter((item) => !item.done);

  return { score, band: getScoreBand(score), missing };
}
