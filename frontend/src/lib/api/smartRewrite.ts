import { callBackend } from "./client";
import type { CreditBalance } from "./credits";

export type RewriteFieldType = "summary" | "experience" | "education";

export interface RewriteVariation {
  label: string;
  text: string;
}

interface SmartRewriteApiResponse {
  variations: RewriteVariation[];
  source: "gemini" | "fallback";
  credits: CreditBalance;
}

export async function smartRewrite(
  fieldType: RewriteFieldType,
  text: string,
): Promise<SmartRewriteApiResponse> {
  return callBackend<SmartRewriteApiResponse>("/api/smart-rewrite", {
    field_type: fieldType,
    text,
  });
}
