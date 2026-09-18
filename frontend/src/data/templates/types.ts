import type { Customization } from "../../types/resume";
import { fontForLanguage } from "../../lib/fonts";
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

/** Template looks should not reset the resume's heading language, nor leave a
 *  Latin font on a Khmer resume - pass the current language to keep both. */
export function designWithoutHeadingLanguage(
  customization: Customization | Partial<Customization>,
  currentHeadingLanguage?: Customization["headingLanguage"],
): Partial<Customization> {
  const { headingLanguage: _headingLanguage, ...rest } = customization;
  if (rest.fontFamily && currentHeadingLanguage) {
    rest.fontFamily = fontForLanguage(
      rest.fontFamily,
      currentHeadingLanguage === "km" ? "km" : "en",
    );
  }
  return rest;
}
