import { useEffect } from "react";
import { useAuth } from "./UseAuth";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { remainingAnalyses } from "../lib/jobAnalyses";
import { getJobAnalyses } from "../lib/api/analyses";

export function useJobAnalyses() {
  const total = useSubscriptionStore((s) => s.analysesTotal);
  const used = useSubscriptionStore((s) => s.analysesUsed);
  const setAnalyses = useSubscriptionStore((s) => s.setAnalyses);
  const remaining = remainingAnalyses(total, used);

  return { total, used, remaining, setAnalyses };
}

export function useHydrateJobAnalyses() {
  const { user } = useAuth();
  const setAnalyses = useSubscriptionStore((s) => s.setAnalyses);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getJobAnalyses()
      .then((analyses) => {
        if (!cancelled) setAnalyses(analyses.total, analyses.used);
      })
      .catch(() => {
        // Keep the cached local balance if the API is briefly unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, setAnalyses]);
}
