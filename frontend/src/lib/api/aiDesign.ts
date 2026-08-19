import { callBackend } from "./client";
import {
  TEMPLATE_PRESETS,
  recommendTemplates,
  type AiAnswers,
  type AiRecommendation,
  type TemplatePreset,
} from "../../data/templates";

interface AiDesignApiResponse {
  primary_template_id: string;
  sibling_template_id: string;
  reasoning: string;
  source: "gemini" | "fallback";
}

export interface AiRecommendationWithReasoning extends AiRecommendation {
  reasoning: string | null;
}

export async function recommendTemplatesAI(
  answers: AiAnswers,
): Promise<AiRecommendationWithReasoning> {
  const premiumOnly = TEMPLATE_PRESETS.filter((p) => p.tier === "premium");

  try {
    const json = await callBackend<AiDesignApiResponse>(
      "/api/ai-design/recommend",
      {
        answers,
        templates: premiumOnly.map((p) => ({
          id: p.id,
          industry: p.industry,
          layout: p.layout,
          vibes: p.vibes,
        })),
      },
    );

    const findPreset = (id: string): TemplatePreset | undefined =>
      premiumOnly.find((p) => p.id === id);

    const primary = findPreset(json.primary_template_id);
    const sibling = findPreset(json.sibling_template_id);
    if (!primary || !sibling) throw new Error("Unknown template id returned");

    return { primary, sibling, reasoning: json.reasoning };
  } catch (err) {
    console.warn("AI design backend call failed, using local fallback:", err);
    return { ...recommendTemplates(answers), reasoning: null };
  }
}
