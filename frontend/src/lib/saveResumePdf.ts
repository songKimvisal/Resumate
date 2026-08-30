import type { Resume } from "../types/resume";
import { BackendError } from "./api/client";
import {
  consumePdfSave,
  pdfsFromErrorBody,
  refundPdfSave,
} from "./api/pdfs";
import { downloadResumePdf, isDownloadAbort } from "./downloadResumePdf";
import { useSubscriptionStore } from "../store/subscriptionStore";

export type SaveResumePdfResult = "ok" | "quota" | "abort";

function applyPdfBalance(total: number, used: number) {
  useSubscriptionStore.getState().setPdfs(total, used);
}

/** Download a resume PDF. The save is consumed on the server before the file is written. */
export async function saveResumePdf(
  resume: Resume,
): Promise<SaveResumePdfResult> {
  try {
    const pdfs = await consumePdfSave();
    applyPdfBalance(pdfs.total, pdfs.used);
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
    try {
      const pdfs = await refundPdfSave();
      applyPdfBalance(pdfs.total, pdfs.used);
    } catch {
      // Keep the consumed balance if refund fails; hydrate will correct it.
    }
    if (isDownloadAbort(err)) return "abort";
    throw err;
  }
}
