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

export function getPdfSaves() {
  return requestBackend<PdfBalance>("/api/pdfs");
}

export function grantPdfSaves(packId: PackId) {
  return requestBackend<PdfBalance>("/api/pdfs/grant", {
    method: "POST",
    body: { pack_id: packId },
  });
}

export function consumePdfSave() {
  return requestBackend<PdfBalance & { consumed: boolean }>("/api/pdfs/consume", {
    method: "POST",
  });
}

export function refundPdfSave() {
  return requestBackend<PdfBalance>("/api/pdfs/refund", {
    method: "POST",
  });
}
