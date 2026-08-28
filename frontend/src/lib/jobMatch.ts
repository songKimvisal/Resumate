import type { Resume } from "../types/resume";

/** Words that look like skills in a job ad but are not addable resume skills. */
const FILLER = new Set([
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
  "not",
  "but",
  "if",
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
  "requirement",
  "preferred",
  "ability",
  "able",
  "strong",
  "good",
  "excellent",
  "using",
  "use",
  "used",
  "spoken",
  "written",
  "oral",
  "verbal",
  "fluent",
  "fluency",
  "native",
  "proficient",
  "proficiency",
  "knowledge",
  "skills",
  "skill",
  "tool",
  "tools",
  "software",
  "computer",
  "computers",
  "internet",
  "microsoft",
  "adobe",
  "google",
  "communication",
  "communications",
  "teamwork",
  "motivated",
  "passionate",
  "hardworking",
  "hard",
  "working",
  "flexible",
  "independent",
  "responsible",
  "responsibility",
  "responsibilities",
  "duties",
  "duty",
  "benefits",
  "benefit",
  "salary",
  "bonus",
  "applicant",
  "applicants",
  "candidate",
  "candidates",
  "please",
  "apply",
  "click",
  "looking",
  "seeking",
  "join",
  "opportunity",
  "environment",
  "workplace",
  "full-time",
  "part-time",
  "fulltime",
  "parttime",
  "intern",
  "plus",
  "etc",
  "others",
  "related",
  "least",
  "minimum",
  "well",
  "both",
  "either",
  "across",
  "within",
  "about",
  "other",
  "such",
  "than",
  "then",
  "also",
  "more",
  "most",
  "only",
  "into",
  "over",
  "under",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "any",
  "all",
  "each",
  "some",
  "many",
  "much",
  "high",
  "level",
  "basic",
  "advance",
  "advanced",
  "understanding",
  "familiar",
  "familiarity",
  "willing",
  "willingness",
  "learn",
  "learning",
  "fast",
  "quickly",
  "detail",
  "oriented",
  "problem",
  "solving",
  "listen",
  "listening",
  "reading",
  "speaking",
  "writing",
  "cambodia",
  "phnom",
  "penh",
  "honest",
  "future",
  "reference",
  "preparation",
  "document",
  "issue",
  "resolving",
  "pressure",
  "interpersonal",
  "developer",
  "development",
  "hybrid",
  "design",
  "term",
]);

const LANGUAGES = new Set([
  "english",
  "khmer",
  "chinese",
  "mandarin",
  "french",
  "korean",
  "japanese",
  "thai",
  "vietnamese",
  "spanish",
]);

/** Longest first. Left side is lowercase in the job ad; right side is the skill label. */
const PHRASE_ALIASES: [string, string][] = [
  ["microsoft powerpoint", "PowerPoint"],
  ["microsoft excel", "Excel"],
  ["microsoft word", "Word"],
  ["microsoft office", "Microsoft Office"],
  ["google sheets", "Google Sheets"],
  ["google docs", "Google Docs"],
  ["google slides", "Google Slides"],
  ["adobe photoshop", "Photoshop"],
  ["adobe illustrator", "Illustrator"],
  ["adobe premiere", "Premiere Pro"],
  ["after effects", "After Effects"],
  ["customer service", "Customer Service"],
  ["data entry", "Data Entry"],
  ["social media", "Social Media"],
  ["graphic design", "Graphic Design"],
  ["video editing", "Video Editing"],
  ["project management", "Project Management"],
  ["digital marketing", "Digital Marketing"],
  ["content creation", "Content Creation"],
  ["facebook ads", "Facebook Ads"],
  ["power bi", "Power BI"],
  ["machine learning", "Machine Learning"],
  ["react native", "React Native"],
  ["hybrid development", "Hybrid Development"],
  ["front-end", "Front-end"],
  ["front end", "Front-end"],
  ["technical support", "Technical Support"],
  ["spoken english", "English"],
  ["written english", "English"],
  ["business english", "English"],
  ["ms powerpoint", "PowerPoint"],
  ["ms excel", "Excel"],
  ["ms word", "Word"],
  ["ms office", "Microsoft Office"],
];

const ALLOW_UNIGRAMS = new Set([
  "accounting",
  "bookkeeping",
  "sales",
  "marketing",
  "cashier",
  "receptionist",
  "logistics",
  "inventory",
  "translation",
  "tutoring",
  "photography",
]);

const KNOWN_TOOLS = new Set([
  "excel",
  "word",
  "powerpoint",
  "canva",
  "figma",
  "photoshop",
  "illustrator",
  "indesign",
  "premiere",
  "python",
  "java",
  "javascript",
  "typescript",
  "html",
  "css",
  "sql",
  "mysql",
  "react",
  "node",
  "autocad",
  "sap",
  "wordpress",
  "shopify",
  "notion",
  "slack",
  "trello",
  "jira",
  "github",
  "git",
  "tableau",
  "quickbooks",
  "xero",
  "tiktok",
  "instagram",
  "facebook",
  "ios",
  "android",
  "swift",
  "kotlin",
  "flutter",
  "frontend",
]);

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}

function uniqueKeepOrder(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resumeHasKeyword(resumeText: string, keyword: string) {
  const k = keyword.trim();
  if (k.length < 2) return false;
  const variants = uniqueKeepOrder([
    k,
    k.replace(/-/g, ""),
    k.replace(/-/g, " "),
    k.replace(/\s+/g, ""),
  ]);
  return variants.some((variant) => {
    const escaped = escapeRegex(variant.toLowerCase()).replace(/\\ /g, "[\\s-]+");
    return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(
      resumeText,
    );
  });
}

function stripSkillPunctuation(value: string) {
  return value
    .replace(/[“”"'`]/g, "")
    .replace(/^[.,;:!?()[\]{}]+/, "")
    .replace(/[.,;:!?()[\]{}]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeToolName(raw: string) {
  const text = stripSkillPunctuation(raw);
  if (text.length < 2 || text.length > 32) return false;
  if (/^iOS$/i.test(text) || /^android$/i.test(text)) return true;
  if (/[0-9+#]/.test(text)) return true;
  if (/\.[a-z]{1,4}$/i.test(text)) return true;
  if (/^[A-Z]{2,6}$/.test(text)) return true;
  if (/^[A-Z][a-zA-Z]+[A-Z]/.test(text)) return true;
  return KNOWN_TOOLS.has(text.toLowerCase());
}

function canonicalLanguage(word: string) {
  const low = word.toLowerCase();
  if (low === "mandarin") return "Chinese";
  return prettyKeyword(low);
}

/** Turn "spoken English" / filler into a real skill label, or empty if junk. */
export function sanitizeSkillKeywords(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const cleaned = stripSkillPunctuation(String(raw || ""));
    if (!cleaned) continue;
    const low = cleaned.toLowerCase();

    const spokenLang = low.match(
      /^(?:spoken|written|oral|verbal|fluent|native)\s+(english|khmer|chinese|mandarin|french|korean|japanese|thai|vietnamese|spanish)\b/,
    );
    if (spokenLang) {
      out.push(canonicalLanguage(spokenLang[1]));
      continue;
    }

    const langOnly = low.match(
      /^(english|khmer|chinese|mandarin|french|korean|japanese|thai|vietnamese|spanish)(?:\s*\((?:spoken|written)\))?$/,
    );
    if (langOnly) {
      out.push(canonicalLanguage(langOnly[1]));
      continue;
    }

    let aliased = "";
    for (const [phrase, label] of PHRASE_ALIASES) {
      if (low === phrase || low.replace(/-/g, " ") === phrase) {
        aliased = label;
        break;
      }
    }
    if (aliased) {
      out.push(aliased);
      continue;
    }

    if (low === "frontend" || low === "front-end") {
      out.push("Front-end");
      continue;
    }
    if (low === "ios") {
      out.push("iOS");
      continue;
    }

    const words = low.split(/[\s,/&]+/).filter(Boolean);
    if (words.length === 0) continue;
    if (words.every((word) => FILLER.has(word))) continue;
    if (words.length === 1 && FILLER.has(words[0])) continue;
    if (words.length === 1 && LANGUAGES.has(words[0])) {
      out.push(canonicalLanguage(words[0]));
      continue;
    }

    const meaningful = words.filter((word) => !FILLER.has(word));
    if (meaningful.length === 0) continue;

    if (
      meaningful.length === 1 &&
      !looksLikeToolName(meaningful[0]) &&
      !KNOWN_TOOLS.has(meaningful[0]) &&
      !ALLOW_UNIGRAMS.has(meaningful[0])
    ) {
      continue;
    }

    out.push(prettyKeyword(meaningful.join(" ")));
  }
  return uniqueKeepOrder(out).slice(0, 10);
}

function extractListedSkills(jobText: string): string[] {
  const found: string[] = [];
  const lineRe =
    /(?:experience in|knowledge (?:in|of)|proficient in|skills?\s*[:]|requirements?\s*[:])\s*([^\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(jobText))) {
    const chunks = match[1]
      .split(/,|&|\band\b|\bor\b/i)
      .map((chunk) => stripSkillPunctuation(chunk.replace(/\bdeveloper\b/gi, "")))
      .filter(Boolean);
    found.push(...chunks);
  }
  const commaLineRe = /^[\s•\-]*([A-Z][A-Za-z0-9+.#\-]*(?:\s*,\s*[A-Z][A-Za-z0-9+.#\-]*){1,8})\s*(?:and\s+other.*)?[.\s]*$/gm;
  let commaMatch: RegExpExecArray | null;
  while ((commaMatch = commaLineRe.exec(jobText))) {
    found.push(
      ...commaMatch[1]
        .split(",")
        .map((chunk) => stripSkillPunctuation(chunk))
        .filter(Boolean),
    );
  }
  return found;
}

/** Pull real requirements from a job ad, not every word. */
export function extractRequirementKeywords(jobText: string): string[] {
  const text = jobText.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const found: string[] = [];
  const used: Array<[number, number]> = [];

  const overlaps = (start: number, end: number) =>
    used.some(([a, b]) => start < b && end > a);

  for (const [phrase, label] of PHRASE_ALIASES) {
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(phrase, from);
      if (at < 0) break;
      const end = at + phrase.length;
      const before = at === 0 ? " " : lower[at - 1];
      const after = end >= lower.length ? " " : lower[end];
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after) && !overlaps(at, end)) {
        found.push(label);
        used.push([at, end]);
      }
      from = at + 1;
    }
  }

  for (const tool of KNOWN_TOOLS) {
    const re = new RegExp(`(^|[^a-z0-9+#])(${escapeRegex(tool)})([^a-z0-9+#]|$)`, "gi");
    let match: RegExpExecArray | null;
    while ((match = re.exec(lower))) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      if (overlaps(start, end)) continue;
      found.push(
        prettyKeyword(
          tool === "premiere"
            ? "Premiere Pro"
            : tool === "ios"
              ? "iOS"
              : tool === "frontend"
                ? "Front-end"
                : tool,
        ),
      );
      used.push([start, end]);
    }
  }

  const langRe =
    /\b(?:spoken|written|oral|verbal|fluent|native)?\s*(english|khmer|chinese|mandarin|french|korean|japanese|thai|vietnamese|spanish)\b/gi;
  let langMatch: RegExpExecArray | null;
  while ((langMatch = langRe.exec(text))) {
    found.push(canonicalLanguage(langMatch[1]));
  }

  found.push(...extractListedSkills(jobText));

  return sanitizeSkillKeywords(found);
}

function jobMentionsSkill(jobText: string, keyword: string) {
  return resumeHasKeyword(jobText, keyword);
}

export function requirementKeywords(
  jobText: string,
  pack?: { matched?: string[]; missing?: string[] } | null,
) {
  const fromJob = extractRequirementKeywords(jobText);
  const fromPack = sanitizeSkillKeywords([
    ...(pack?.matched ?? []),
    ...(pack?.missing ?? []),
  ]).filter((keyword) => jobMentionsSkill(jobText, keyword));
  return uniqueKeepOrder([...fromJob, ...fromPack]).slice(0, 10);
}

export function resumePlainText(resume: Resume): string {
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
  const trimmed = token.trim();
  if (!trimmed) return "";
  if (/^[a-z0-9+#.]{2,6}$/i.test(trimmed) && trimmed === trimmed.toUpperCase()) {
    return trimmed;
  }
  if (
    trimmed.length <= 4 &&
    /[a-z]/i.test(trimmed) &&
    !/[aeiou]/i.test(trimmed)
  ) {
    return trimmed.toUpperCase();
  }
  const known: Record<string, string> = {
    excel: "Excel",
    word: "Word",
    powerpoint: "PowerPoint",
    canva: "Canva",
    figma: "Figma",
    photoshop: "Photoshop",
    illustrator: "Illustrator",
    python: "Python",
    javascript: "JavaScript",
    typescript: "TypeScript",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    mysql: "MySQL",
    react: "React",
    autocad: "AutoCAD",
    sap: "SAP",
    github: "GitHub",
    ios: "iOS",
    android: "Android",
    frontend: "Front-end",
    "front-end": "Front-end",
    "power bi": "Power BI",
  };
  const low = trimmed.toLowerCase();
  if (known[low]) return known[low];
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Keyword overlap using real job requirements, not every word in the ad. */
export function computeJobMatch(
  jobText: string,
  resume: Resume,
  required?: string[],
): JobMatchResult {
  const keywords = (required?.length ? required : requirementKeywords(jobText))
    .map((item) => item.trim())
    .filter(Boolean);
  if (keywords.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const haystack = resumePlainText(resume);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of keywords) {
    if (resumeHasKeyword(haystack, keyword)) matched.push(keyword);
    else missing.push(keyword);
  }

  return {
    score: Math.round((matched.length / keywords.length) * 100),
    matched: matched.slice(0, 10),
    missing: missing.slice(0, 10),
  };
}

export function missingSkillKeywords(
  jobText: string,
  resume: Resume,
  pack?: { matched?: string[]; missing?: string[] } | null,
) {
  return computeJobMatch(
    jobText,
    resume,
    requirementKeywords(jobText, pack),
  ).missing;
}
