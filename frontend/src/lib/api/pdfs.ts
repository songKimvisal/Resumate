import { requestBackend } from "./client";
import type { PackId } from "../../types/billing";

export interface PdfBalance {
  total: number;
  used: number;
  remaining: number;
}

export function pdfsFromErrorBody(body: unknown): PdfBalance | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail?: { pdfs?: PdfBalance } }).detail;
  const pdfs = detail?.pdfs;
  if (
    !pdfs ||
    typeof pdfs.total !== "number" ||
    typeof pdfs.used !== "number"
  ) {
    return null;
  }
  return pdfs;
}

export interface PdfStatus extends PdfBalance {
  unlocked_resume_ids?: string[];
}

export function getPdfSaves() {
  return requestBackend<PdfStatus>("/api/pdfs");
}

export function grantPdfSaves(packId: PackId) {
  return requestBackend<PdfBalance>("/api/pdfs/grant", {
    method: "POST",
    body: { pack_id: packId },
  });
}

/** With a saved resume's id, re-downloading that resume is free. */
export function consumePdfSave(resumeId?: string | null) {
  return requestBackend<PdfBalance & { consumed: boolean; charged?: boolean }>(
    "/api/pdfs/consume",
    {
      method: "POST",
      body: resumeId ? { resume_id: resumeId } : {},
    },
  );
}

export function refundPdfSave(resumeId?: string | null) {
  return requestBackend<PdfBalance>("/api/pdfs/refund", {
    method: "POST",
    body: resumeId ? { resume_id: resumeId } : {},
  });
}
