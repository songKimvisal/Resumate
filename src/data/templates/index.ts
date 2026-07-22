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

/** All template presets, grouped one file per industry under `./free/` or
 *  `./premium/` depending on tier. To add a new industry: create
 *  `<industry>.ts` under the matching tier folder exporting a `preset()`
 *  array (see `types.ts`) and list it below. To add a variant to an existing
 *  industry, add a `preset()` call to that industry's file — nothing else to
 *  wire up. An industry that offers both tiers gets a file in each folder. */
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

/** Derived from the presets themselves, in first-seen order, so a new
 *  industry file shows up in the marketplace filters automatically. */
export const INDUSTRIES: TemplateIndustry[] = Array.from(
  new Set(TEMPLATE_PRESETS.map((p) => p.industry)),
);

/** i18n key suffix under marketplace.colorNames, keyed by swatch hex. */
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
  vibe: AiVibeAnswer;
}

/** "Government / Public" has no dedicated gallery category — it maps to the
 *  same formal, understated tone as the Banking templates. */
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
  if (candidate.vibes.includes(answers.vibe)) score += 2;
  score += EXPERIENCE_VIBE_HINTS[answers.experience].filter((v) =>
    candidate.vibes.includes(v),
  ).length;
  return score;
}

export interface AiRecommendation {
  primary: TemplatePreset;
  /** same industry, opposite layout — shown side by side for comparison */
  sibling: TemplatePreset;
}

/** The AI picker only ever recommends premium templates — it's the upsell
 *  path into the paid catalog, so free templates never surface here even if
 *  they'd technically score higher. */
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
