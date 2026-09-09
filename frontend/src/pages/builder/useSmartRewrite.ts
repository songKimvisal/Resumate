import { useState } from "react";
import {
  smartRewrite,
  type RewriteFieldType,
  type RewriteVariation,
} from "../../lib/api/smartRewrite";
import { BackendError } from "../../lib/api/client";
import { creditsFromErrorBody } from "../../lib/api/credits";
import { useAiCredits } from "../../hooks/useAiCredits";

export function useSmartRewrite(fieldType: RewriteFieldType) {
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<RewriteVariation[] | null>(null);
  const { remaining, setCredits } = useAiCredits();

  const generate = async (text: string) => {
    const hasContent = text.replace(/<[^>]*>/g, "").trim().length > 0;
    if (!hasContent || loading || remaining <= 0) return;
    setLoading(true);
    try {
      const result = await smartRewrite(fieldType, text);
      setCredits(result.credits.total, result.credits.used);
      setVariations(result.variations);
    } catch (err) {
      if (err instanceof BackendError) {
        const credits = creditsFromErrorBody(err.body);
        if (credits) setCredits(credits.total, credits.used);
      }
      console.warn("Smart rewrite failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => setVariations(null);

  return { loading, variations, generate, dismiss };
}
