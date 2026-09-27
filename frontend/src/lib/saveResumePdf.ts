import type { Resume } from "../types/resume";
import { BackendError } from "./api/client";
import {
  consumePdfSave,
  pdfsFromErrorBody,
  refundPdfSave,
} from "./api/pdfs";
import { downloadResumePdf } from "./downloadResumePdf";
import { useSubscriptionStore } from "../store/subscriptionStore";

export type SaveResumePdfResult = "ok" | "quota";

function applyPdfBalance(total: number, used: number) {
  useSubscriptionStore.getState().setPdfs(total, used);
}

export async function saveResumePdf(
  resume: Resume,
): Promise<SaveResumePdfResult> {
  const store = useSubscriptionStore.getState();
  const resumeId = resume.id;
  let charged: boolean;
  try {
    const pdfs = await consumePdfSave(resumeId);
    applyPdfBalance(pdfs.total, pdfs.used);
    charged = pdfs.charged ?? true;
    if (resumeId) store.setResumeUnlocked(resumeId, true);
  } catch (err) {
    if (err instanceof BackendError && err.status === 402) {
      const pdfs = pdfsFromErrorBody(err.body);
      if (pdfs) applyPdfBalance(pdfs.total, pdfs.used);
      return "quota";
    }
    throw err;
  }

  try {
    await downloadResumePdf(resume);
    return "ok";
  } catch (err) {
    // Only give back what this attempt spent.
    if (charged) {
      try {
        const pdfs = await refundPdfSave(resumeId);
        applyPdfBalance(pdfs.total, pdfs.used);
        if (resumeId) store.setResumeUnlocked(resumeId, false);
      } catch {
      }
    }
    throw err;
  }
}
