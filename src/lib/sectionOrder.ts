import type { SectionOrderKey } from "../types/resume";

export function orderedMainGroups(
  order: SectionOrderKey[],
): ("experience" | "skillsLanguage" | "references")[] {
  const seen = new Set<string>();
  const result: ("experience" | "skillsLanguage" | "references")[] = [];
  for (const key of order) {
    const group = key === "skills" || key === "language" ? "skillsLanguage" : key;
    if (!seen.has(group)) {
      seen.add(group);
      result.push(group);
    }
  }
  (["experience", "skillsLanguage", "references"] as const).forEach((g) => {
    if (!seen.has(g)) result.push(g);
  });
  return result;
}
export function orderedSidebarKeys(
  order: SectionOrderKey[],
): ("skills" | "language" | "references")[] {
  const seen = new Set<string>();
  const result: ("skills" | "language" | "references")[] = [];
  for (const key of order) {
    if (
      (key === "skills" || key === "language" || key === "references") &&
      !seen.has(key)
    ) {
      seen.add(key);
      result.push(key);
    }
  }
  (["skills", "language", "references"] as const).forEach((k) => {
    if (!seen.has(k)) result.push(k);
  });
  return result;
}
