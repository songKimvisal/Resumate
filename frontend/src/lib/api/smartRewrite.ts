import { callBackend } from "./client";

export type RewriteFieldType = "summary" | "experience" | "education";

export interface RewriteVariation {
  label: string;
  text: string;
}

interface SmartRewriteApiResponse {
  variations: RewriteVariation[];
  source: "gemini" | "fallback";
}
export async function smartRewrite(
  fieldType: RewriteFieldType,
  text: string,
): Promise<RewriteVariation[]> {
  const json = await callBackend<SmartRewriteApiResponse>("/api/smart-rewrite", {
    field_type: fieldType,
    text,
  });
  return json.variations;
}
