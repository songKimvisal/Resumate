import { useEffect } from "react";
import { useAuth } from "./UseAuth";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { remainingPdfs } from "../lib/pdfSaves";
import { getPdfSaves } from "../lib/api/pdfs";

export function usePdfSaves() {
  const total = useSubscriptionStore((s) => s.pdfsTotal);
  const used = useSubscriptionStore((s) => s.pdfsUsed);
  const remaining = remainingPdfs(total, used);
  const canSave = remaining > 0;

  return { total, used, remaining, canSave };
}

export function useHydratePdfSaves() {
  const { user } = useAuth();
  const setPdfs = useSubscriptionStore((s) => s.setPdfs);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getPdfSaves()
      .then((pdfs) => {
        if (!cancelled) setPdfs(pdfs.total, pdfs.used);
      })
      .catch(() => {
        // Keep the cached local balance if the API is briefly unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, setPdfs]);
}
