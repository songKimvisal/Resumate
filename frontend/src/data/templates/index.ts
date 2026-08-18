import type {
  TemplateIndustry,
  TemplatePreset,
  TemplateTier,
  TemplateLayout,
  TemplateVibe,
} from "./types";
import { BANKING_FREE_TEMPLATES } from "./free/banking";
import { TECH_FREE_TEMPLATES } from "./free/tech";
import { FRESHGRAD_FREE_TEMPLATES } from "./free/freshgrad";
import { BANKING_PREMIUM_TEMPLATES } from "./premium/banking";
import { NGO_PREMIUM_TEMPLATES } from "./premium/ngo";
import { TECH_PREMIUM_TEMPLATES } from "./premium/tech";
import { HOSPITALITY_PREMIUM_TEMPLATES } from "./premium/hospitality";
import { FRESHGRAD_PREMIUM_TEMPLATES } from "./premium/freshgrad";
import { DESIGNER_PREMIUM_TEMPLATES } from "./premium/designer";

export type {
  TemplateIndustry,
  TemplatePreset,
  TemplateTier,
  TemplateLayout,
  TemplateVibe,
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  ...BANKING_FREE_TEMPLATES,
  ...BANKING_PREMIUM_TEMPLATES,
  ...NGO_PREMIUM_TEMPLATES,
  ...TECH_FREE_TEMPLATES,
  ...TECH_PREMIUM_TEMPLATES,
  ...HOSPITALITY_PREMIUM_TEMPLATES,
  ...FRESHGRAD_FREE_TEMPLATES,
  ...FRESHGRAD_PREMIUM_TEMPLATES,
  ...DESIGNER_PREMIUM_TEMPLATES,
];


export const INDUSTRIES: TemplateIndustry[] = Array.from(
  new Set(TEMPLATE_PRESETS.map((p) => p.industry)),
);

export const ACCENT_COLOR_KEYS: Record<string, string> = {
  "#C1121F": "crimson",
  "#EA580C": "orange",
  "#D97706": "amber",
  "#65A30D": "green",
  "#0F766E": "teal",
  "#0891B2": "cyan",
  "#1D4ED8": "blue",
  "#7C3AED": "violet",
  "#DB2777": "pink",
  "#374151": "navy",
};

export const ACCENT_COLOR_SWATCHES = Object.keys(ACCENT_COLOR_KEYS);

// ------------------------------------------------------------------ AI pick

export type AiIndustryAnswer =
  | "banking"
  | "ngo"
  | "tech"
  | "hospitality"
  | "freshgrad"
  | "designer"
  | "government";
export type AiExperienceAnswer = "fresh" | "junior" | "mid" | "senior";
export type AiVibeAnswer = TemplateVibe;

export interface AiAnswers {
  industry: AiIndustryAnswer;
  experience: AiExperienceAnswer;
  vibe: AiVibeAnswer[];
}

const INDUSTRY_MATCH: Record<AiIndustryAnswer, TemplateIndustry> = {
  banking: "banking",
  ngo: "ngo",
  tech: "tech",
  hospitality: "hospitality",
  freshgrad: "freshgrad",
  designer: "designer",
  government: "banking",
};

const EXPERIENCE_VIBE_HINTS: Record<AiExperienceAnswer, TemplateVibe[]> = {
  fresh: ["friendly", "cleanMinimal"],
  junior: ["cleanMinimal", "modernCreative"],
  mid: ["professional", "boldConfident"],
  senior: ["elegantRefined", "professional"],
};

function scoreTemplate(candidate: TemplatePreset, answers: AiAnswers): number {
  let score = 0;
  if (candidate.industry === INDUSTRY_MATCH[answers.industry]) score += 4;
  score += answers.vibe.filter((v) => candidate.vibes.includes(v)).length * 2;
  score += EXPERIENCE_VIBE_HINTS[answers.experience].filter((v) =>
    candidate.vibes.includes(v),
  ).length;
  return score;
}

export interface AiRecommendation {
  primary: TemplatePreset;
  sibling: TemplatePreset;
}
export function recommendTemplates(answers: AiAnswers): AiRecommendation {
  const premiumOnly = TEMPLATE_PRESETS.filter((p) => p.tier === "premium");
  const ranked = [...premiumOnly].sort(
    (a, b) => scoreTemplate(b, answers) - scoreTemplate(a, answers),
  );
  const primary = ranked[0];
  const sibling =
    premiumOnly.find(
      (p) => p.industry === primary.industry && p.layout !== primary.layout,
    ) ??
    premiumOnly.find((p) => p.layout !== primary.layout) ??
    primary;
  return { primary, sibling };
}
