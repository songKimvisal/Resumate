import type { Customization, NoExperienceItem } from "../types/resume";
import { NO_EXPERIENCE_TYPE_LABELS } from "../types/resume";
import { headingLang, resumeNoExpType } from "./resumeHeadings";

/** ATS-safe title: role/project name plus a plain-text type, without
 *  duplicating words the user already wrote (e.g. "Marketing Intern"). */
export function formatExperienceTitle(title: string, typeLabel: string): string {
  const name = title.trim();
  const label = typeLabel.trim();
  if (!name) return label;
  if (!label || titleAlreadyMentionsType(name, label)) return name;
  return `${name} (${label})`;
}

export function extraExperienceTitle(
  item: NoExperienceItem,
  customization?: Pick<Customization, "headingLanguage"> | null,
): string {
  const typeLabel =
    headingLang(customization) === "km"
      ? resumeNoExpType(item.type, customization)
      : NO_EXPERIENCE_TYPE_LABELS[item.type];
  return formatExperienceTitle(item.title, typeLabel);
}

function titleAlreadyMentionsType(title: string, typeLabel: string): boolean {
  const t = title.toLowerCase();
  const l = typeLabel.toLowerCase();
  if (t.includes(l)) return true;
  if (l.includes("intern") && /\bintern(?:ship)?\b/.test(t)) return true;
  if (l.includes("volunteer") && t.includes("volunteer")) return true;
  if (l.includes("project") && t.includes("project")) return true;
  if (
    l.includes("competition") &&
    (t.includes("competition") || t.includes("hackathon") || t.includes("contest"))
  ) {
    return true;
  }
  if (
    l.includes("part-time") &&
    (t.includes("part-time") || t.includes("part time") || t.includes("freelance"))
  ) {
    return true;
  }
  return false;
}
