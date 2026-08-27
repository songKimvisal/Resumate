import type { LinkItem } from "../types/resume";

const FIELD_LABELS: Record<string, string> = {
  website: "Website",
  linkedin: "LinkedIn",
  portfolio: "Portfolio",
  github: "GitHub",
  gitlab: "GitLab",
  stackoverflow: "Stack Overflow",
  telegram: "Telegram",
};

export function looksLikeUrl(value: string) {
  const v = value.trim();
  if (!v) return false;
  return /^(https?:\/\/)/i.test(v) || /^([\w-]+\.)+[a-z]{2,}/i.test(v);
}

export function hrefFromUrl(url: string) {
  const v = url.trim();
  if (!v) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  return `https://${v.replace(/^\/\//, "")}`;
}

/** Label the user typed, or the field name. The URL never changes this. */
export function linkDisplayLabel(
  entry: Pick<LinkItem, "title" | "url">,
  field: string,
) {
  const title = (entry.title || "").trim();
  if (title && !looksLikeUrl(title)) return title;
  return FIELD_LABELS[field] || "Link";
}
