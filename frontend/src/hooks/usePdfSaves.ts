import { useSubscriptionStore } from "../store/subscriptionStore";
import { remainingPdfs } from "../lib/pdfSaves";

export function usePdfSaves() {
  const total = useSubscriptionStore((s) => s.pdfsTotal);
  const used = useSubscriptionStore((s) => s.pdfsUsed);
  const remaining = remainingPdfs(total, used);
  const canSave = remaining > 0;

  return { total, used, remaining, canSave };
}
