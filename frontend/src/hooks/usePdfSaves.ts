import { useEffect } from "react";
import { useAuth } from "./UseAuth";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { remainingPdfs } from "../lib/pdfSaves";
import { getPdfSaves } from "../lib/api/pdfs";

export type PdfDownloadState = "unlocked" | "available" | "blocked";

export function usePdfSaves() {
  const total = useSubscriptionStore((s) => s.pdfsTotal);
  const used = useSubscriptionStore((s) => s.pdfsUsed);
  const remaining = remainingPdfs(total, used);
  const canSave = remaining > 0;
  const unlockedResumeIds = useSubscriptionStore((s) => s.unlockedResumeIds);
  const isUnlocked = (resumeId: string | null | undefined) =>
    Boolean(resumeId && unlockedResumeIds.includes(resumeId));
  const canDownload = (resumeId: string | null | undefined) =>
    canSave || isUnlocked(resumeId);

  const downloadState = (
    resumeId: string | null | undefined,
  ): PdfDownloadState =>
    isUnlocked(resumeId) ? "unlocked" : canSave ? "available" : "blocked";

  return {
    total,
    used,
    remaining,
    canSave,
    isUnlocked,
    canDownload,
    downloadState,
  };
}

export function useHydratePdfSaves() {
  const { user } = useAuth();
  const setPdfs = useSubscriptionStore((s) => s.setPdfs);
  const setUnlockedResumeIds = useSubscriptionStore(
    (s) => s.setUnlockedResumeIds,
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getPdfSaves()
      .then((pdfs) => {
        if (cancelled) return;
        setPdfs(pdfs.total, pdfs.used);
        setUnlockedResumeIds(pdfs.unlocked_resume_ids ?? []);
      })
      .catch(() => {
        // Keep the cached local balance if the API is briefly unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, setPdfs, setUnlockedResumeIds]);
}
