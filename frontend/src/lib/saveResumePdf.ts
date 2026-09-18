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
    }
    throw err;
  }
}
