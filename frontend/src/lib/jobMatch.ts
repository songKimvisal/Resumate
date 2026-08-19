import type { Resume } from "../types/resume";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
  "i",
  "me",
  "my",
  "he",
  "she",
  "his",
  "her",
  "not",
  "but",
  "if",
  "than",
  "then",
  "so",
  "into",
  "over",
  "under",
  "about",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "also",
  "more",
  "most",
  "other",
  "such",
  "only",
  "own",
  "same",
  "too",
  "very",
  "just",
  "all",
  "any",
  "both",
  "each",
  "few",
  "many",
  "much",
  "some",
  "no",
  "nor",
  "up",
  "out",
  "off",
  "again",
  "further",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "what",
  "which",
  "who",
  "whom",
  "job",
  "work",
  "role",
  "position",
  "team",
  "company",
  "experience",
  "years",
  "year",
  "including",
  "include",
  "required",
  "requirements",
  "preferred",
  "ability",
  "able",
  "strong",
  "good",
  "excellent",
  "using",
  "use",
  "used",
]);

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function uniqueTokens(text: string): Set<string> {
  return new Set(tokenize(text));
}

function resumePlainText(resume: Resume): string {
  const { personal, experience, noExperience, education, skills, languages } =
    resume;
  const parts: string[] = [
    personal.fullName,
    personal.jobTitle,
    personal.summary,
    personal.location,
    ...skills.map((s) => s.name),
    ...languages.map((l) => l.name),
    ...education.flatMap((e) => [
      e.school,
      e.degree,
      e.field,
      stripHtml(e.description),
    ]),
    ...experience.flatMap((e) => [
      e.jobTitle,
      e.company,
      e.location,
      stripHtml(e.description),
    ]),
    ...noExperience.flatMap((e) => [
      e.title,
      e.subtitle,
      stripHtml(e.description),
    ]),
  ];
  return parts.filter(Boolean).join(" ");
}

export interface JobMatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

export function prettyKeyword(token: string) {
  if (/^[a-z0-9+#.]{2,6}$/i.test(token) && token === token.toUpperCase()) {
    return token;
  }
  if (token.length <= 4 && /[a-z]/i.test(token) && !/[aeiou]/i.test(token)) {
    return token.toUpperCase();
  }
  return token.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Lightweight keyword overlap between a job ad and the selected resume. */
export function computeJobMatch(
  jobText: string,
  resume: Resume,
): JobMatchResult {
  const jobTokens = uniqueTokens(jobText);
  const resumeTokens = uniqueTokens(resumePlainText(resume));

  if (jobTokens.size === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const token of jobTokens) {
    if (resumeTokens.has(token)) matched.push(token);
    else missing.push(token);
  }

  // Prefer skill-like / longer tokens when ranking missing keywords
  matched.sort((a, b) => b.length - a.length || a.localeCompare(b));
  missing.sort((a, b) => b.length - a.length || a.localeCompare(b));

  const score = Math.round((matched.length / jobTokens.size) * 100);

  return {
    score,
    matched: matched.slice(0, 12),
    missing: missing.slice(0, 12),
  };
}
