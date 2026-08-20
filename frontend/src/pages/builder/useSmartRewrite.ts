import { useState } from "react";
import {
  smartRewrite,
  type RewriteFieldType,
  type RewriteVariation,
} from "../../lib/api/smartRewrite";

/**
 * Manages the "ask AI to rewrite this text" flow for a single field:
 * loading state + the resulting suggestions (or null if none requested /
 * already dismissed). Each field in the builder (summary, an experience
 * card's achievements, an education card's description) gets its own
 * instance of this hook, so their suggestion panels are independent.
 */
export function useSmartRewrite(fieldType: RewriteFieldType) {
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<RewriteVariation[] | null>(null);

  const generate = async (text: string) => {
    const hasContent = text.replace(/<[^>]*>/g, "").trim().length > 0;
    if (!hasContent || loading) return;
    setLoading(true);
    try {
      const results = await smartRewrite(fieldType, text);
      setVariations(results);
    } catch (err) {
      console.warn("Smart rewrite failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => setVariations(null);

  return { loading, variations, generate, dismiss };
}
