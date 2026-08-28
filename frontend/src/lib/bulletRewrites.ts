import type { Resume } from "../types/resume";
import type { JobAnalysisPack } from "../store/journeyStore";
import { prettyKeyword } from "./jobMatch";

export type RewriteKind = "experience" | "noExperience";

export type BulletRewriteSuggestion = {
  id: string;
  role: string;
  current: string;
  suggested: string;
  keyword: string;
  entryId: string;
  kind: RewriteKind;
};

type ResumeEntry = {
  id: string;
  kind: RewriteKind;
  role: string;
  description: string;
};

const WEAK_START =
  /^(responsible for|worked on|helped with|helped|duties included|was in charge of|tasked with)\s+/i;

const STRONG_START =
  /^(led|built|created|managed|designed|organized|supported|developed|coordinated|handled|wrote|taught|improved|analyzed|implemented|collaborated)/i;

export function stripResumeHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstLine(plain: string) {
  return (
    plain
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .find((line) => line.length > 0) ?? ""
  );
}

function resumeEntries(resume: Resume): ResumeEntry[] {
  return [
    ...resume.experience.map((item) => ({
      id: item.id,
      kind: "experience" as const,
      role:
        [item.jobTitle, item.company].filter(Boolean).join(" · ") ||
        "Experience",
      description: item.description || "",
    })),
    ...resume.noExperience.map((item) => ({
      id: item.id,
      kind: "noExperience" as const,
      role:
        [item.title, item.subtitle].filter(Boolean).join(" · ") || "Project",
      description: item.description || "",
    })),
  ];
}

/** Keep the user's facts. Add a job keyword only in the wording. */
export function strengthenBullet(original: string, keyword: string) {
  let text = firstLine(original) || original.trim();
  text = text.replace(/\.+$/, "");
  if (WEAK_START.test(text)) {
    text = text.replace(WEAK_START, "");
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  if (text && !STRONG_START.test(text)) {
    text = `Supported ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }
  const label = prettyKeyword(keyword);
  if (label && !new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i").test(text)) {
    text = text ? `${text}, using ${label}` : `Used ${label} in this role`;
  }
  if (!text) return "";
  return text.endsWith(".") ? text : `${text}.`;
}

export function buildFallbackBulletRewrites(
  resume: Resume,
  missing: string[],
): BulletRewriteSuggestion[] {
  const keywords = missing.map((item) => item.trim()).filter(Boolean);
  const entries = resumeEntries(resume).filter((entry) => {
    const plain = stripResumeHtml(entry.description);
    return plain.length >= 8;
  });
  if (!entries.length || !keywords.length) return [];

  const out: BulletRewriteSuggestion[] = [];
  let keywordIndex = 0;
  for (const entry of entries) {
    if (out.length >= 3) break;
    const plain = stripResumeHtml(entry.description);
    const current = firstLine(plain) || plain;
    let keyword = keywords[keywordIndex % keywords.length];
    for (let offset = 0; offset < keywords.length; offset++) {
      const candidate = keywords[(keywordIndex + offset) % keywords.length];
      if (!new RegExp(`\\b${escapeRegex(candidate)}\\b`, "i").test(plain)) {
        keyword = candidate;
        keywordIndex = keywordIndex + offset + 1;
        break;
      }
    }
    const suggested = strengthenBullet(current, keyword);
    if (!suggested || suggested === current) continue;
    out.push({
      id: `${entry.kind}:${entry.id}:${keyword.toLowerCase()}`,
      role: entry.role,
      current,
      suggested,
      keyword,
      entryId: entry.id,
      kind: entry.kind,
    });
  }
  return out;
}

function matchScore(
  entry: ResumeEntry,
  rewrite: { role?: string; current?: string },
) {
  const plain = stripResumeHtml(entry.description).toLowerCase();
  const current = (rewrite.current || "").trim().toLowerCase();
  const role = (rewrite.role || "").trim().toLowerCase();
  let score = 0;
  if (current && plain.includes(current.slice(0, 48))) score += 5;
  if (role && entry.role.toLowerCase().includes(role.slice(0, 28))) score += 3;
  if (role && role.includes(entry.role.toLowerCase().slice(0, 28))) score += 2;
  return score;
}

export function resolveBulletRewrites(
  pack: JobAnalysisPack | undefined,
  resume: Resume,
): BulletRewriteSuggestion[] {
  const entries = resumeEntries(resume);
  const fromPack = pack?.bulletRewrites ?? [];
  if (fromPack.length && entries.length) {
    const used = new Set<string>();
    const out: BulletRewriteSuggestion[] = [];
    fromPack.forEach((item, index) => {
      const suggested = (item.suggested || "").trim();
      if (!suggested) return;
      let best: ResumeEntry | null = null;
      let bestScore = 0;
      for (const entry of entries) {
        if (used.has(entry.id)) continue;
        const score = matchScore(entry, item);
        if (score > bestScore) {
          best = entry;
          bestScore = score;
        }
      }
      const entry =
        bestScore > 0
          ? best
          : (entries.find((item) => !used.has(item.id)) ?? null);
      if (!entry) return;
      used.add(entry.id);
      const plain = stripResumeHtml(entry.description);
      out.push({
        id: item.id || `ai-${index}`,
        role: item.role || entry.role,
        current: (
          item.current ||
          firstLine(plain) ||
          plain ||
          "No bullet yet"
        ).trim(),
        suggested,
        keyword: item.keyword || "",
        entryId: entry.id,
        kind: entry.kind,
      });
    });
    if (out.length) return out.slice(0, 4);
  }
  return buildFallbackBulletRewrites(resume, pack?.missing ?? []);
}

/** Replace the first bullet or paragraph. Leave the rest of the entry as-is. */
export function applySuggestedToHtml(originalHtml: string, suggested: string) {
  const safe = escapeHtml(suggested.trim());
  if (!originalHtml.trim()) {
    return `<ul><li><p>${safe}</p></li></ul>`;
  }
  if (/<li[\s>]/i.test(originalHtml)) {
    return originalHtml.replace(
      /(<li[^>]*>)([\s\S]*?)(<\/li>)/i,
      `$1<p>${safe}</p>$3`,
    );
  }
  if (/<p[\s>]/i.test(originalHtml)) {
    return originalHtml.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/i, `$1${safe}$3`);
  }
  return `<p>${safe}</p>`;
}
