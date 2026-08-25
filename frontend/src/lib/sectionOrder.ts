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

const ALL_SECTION_KEYS: SectionOrderKey[] = [
  "skills",
  "experience",
  "references",
  "language",
];

/** splits `order` into the sections that render in the main column vs. the
 *  sidebar column, preserving each side's relative order - used in
 *  two-column mode, where `sidebarKeys` records which sections the user has
 *  dragged into the sidebar (anything else defaults to the main column) */
export function partitionSectionOrder(
  order: SectionOrderKey[],
  sidebarKeys: SectionOrderKey[] | undefined,
): { main: SectionOrderKey[]; sidebar: SectionOrderKey[] } {
  const sidebarSet = new Set(sidebarKeys ?? []);
  const seen = new Set<string>();
  const main: SectionOrderKey[] = [];
  const sidebar: SectionOrderKey[] = [];
  for (const key of order) {
    if (seen.has(key)) continue;
    seen.add(key);
    (sidebarSet.has(key) ? sidebar : main).push(key);
  }
  ALL_SECTION_KEYS.forEach((key) => {
    if (!seen.has(key)) main.push(key);
  });
  return { main, sidebar };
}
