import type { Resume } from "../types/resume";

/** Never return "" - React treats duplicate empty keys as a hard warning. */
export function listKey(
  id: string | undefined | null,
  index: number,
  prefix: string,
): string {
  const trimmed = (id ?? "").trim();
  return trimmed ? `${prefix}-${trimmed}` : `${prefix}-${index}`;
}

function remapIds<T extends { id: string }>(
  items: T[] | undefined | null,
  prefix: string,
): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.map((item, i) => {
    if (!item || typeof item !== "object") {
      return { id: `${prefix}-${i}` } as T;
    }
    const trimmed = (item.id ?? "").trim();
    let id = trimmed && !seen.has(trimmed) ? trimmed : `${prefix}-${i}`;
    if (seen.has(id)) id = `${prefix}-${i}-${seen.size}`;
    seen.add(id);
    return id === item.id ? item : { ...item, id };
  });
}

export function withStableItemIds(resume: Resume): Resume {
  const personal = resume.personal;
  return {
    ...resume,
    personal: {
      ...personal,
      portfolio: remapIds(personal?.portfolio, "portfolio"),
      website: remapIds(personal?.website, "website"),
      linkedin: remapIds(personal?.linkedin, "linkedin"),
      github: remapIds(personal?.github, "github"),
      gitlab: remapIds(personal?.gitlab, "gitlab"),
      stackoverflow: remapIds(personal?.stackoverflow, "stackoverflow"),
      telegram: remapIds(personal?.telegram, "telegram"),
    },
    experience: remapIds(resume.experience, "exp"),
    noExperience: remapIds(resume.noExperience, "noexp"),
    education: remapIds(resume.education, "edu"),
    skills: remapIds(resume.skills, "skill"),
    languages: remapIds(resume.languages, "lang"),
    references: remapIds(resume.references, "ref"),
  };
}
