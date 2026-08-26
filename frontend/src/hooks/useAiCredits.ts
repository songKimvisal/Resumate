import { useEffect } from "react";
import { useAuth } from "./UseAuth";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { remainingAiCredits } from "../lib/aiCredits";
import { getAiCredits } from "../lib/api/credits";

export function useAiCredits() {
  const total = useSubscriptionStore((s) => s.aiCreditsTotal);
  const used = useSubscriptionStore((s) => s.aiCreditsUsed);
  const setCredits = useSubscriptionStore((s) => s.setCredits);
  const remaining = remainingAiCredits(total, used);

  return { total, used, remaining, setCredits };
}

export function useHydrateAiCredits() {
  const { user } = useAuth();
  const setCredits = useSubscriptionStore((s) => s.setCredits);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAiCredits()
      .then((credits) => {
        if (!cancelled) setCredits(credits.total, credits.used);
      })
      .catch(() => {
        // Keep the cached local balance if the API is briefly unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, setCredits]);
}
