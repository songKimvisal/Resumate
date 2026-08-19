import type { Customization } from "../../types/resume";
import { emptyResume } from "../../types/resume";
export type TemplateIndustry =
  | "banking"
  | "ngo"
  | "tech"
  | "hospitality"
  | "freshgrad"
  | "designer";
export type TemplateTier = "free" | "premium";
export type TemplateLayout = "classic" | "sidebar";
export type TemplateVibe =
  | "professional"
  | "modernCreative"
  | "cleanMinimal"
  | "boldConfident"
  | "friendly"
  | "elegantRefined";
export interface TemplatePreset {
  id: string;
  styleKey: string;
  layout: TemplateLayout;
  industry: TemplateIndustry;
  tier: TemplateTier;
  vibes: TemplateVibe[];
  customization: Customization;
}
const BASE = emptyResume.customization;
export function preset(
  id: string,
  styleKey: string,
  layout: TemplateLayout,
  industry: TemplateIndustry,
  tier: TemplateTier,
  vibes: TemplateVibe[],
  patch: Partial<Omit<Customization, "toggles">> & {
    toggles?: Partial<Customization["toggles"]>;
  },
): TemplatePreset {
  return {
    id,
    styleKey,
    layout,
    industry,
    tier,
    vibes,
    customization: {
      ...BASE,
      ...patch,
      template: id,
      toggles: { ...BASE.toggles, ...patch.toggles },
    },
  };
}
