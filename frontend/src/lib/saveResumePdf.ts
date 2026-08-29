import type { Resume } from "../types/resume";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { downloadResumePdf, isDownloadAbort } from "./downloadResumePdf";

export type SaveResumePdfResult = "ok" | "quota" | "abort";

/** Download a resume PDF, consuming a save only after the file is written. */
export async function saveResumePdf(
  resume: Resume,
): Promise<SaveResumePdfResult> {
  const store = useSubscriptionStore.getState();
  if (!store.canSavePdf()) return "quota";
  try {
    await downloadResumePdf(resume);
    if (!store.consumePdfSave()) return "quota";
    return "ok";
  } catch (err) {
    if (isDownloadAbort(err)) return "abort";
    throw err;
  }
}
