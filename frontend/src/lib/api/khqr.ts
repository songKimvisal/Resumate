import { requestBackend } from "./client";

/** The QR is generated for the server's price for this SKU. */
export function createKhqrPayment(params: { packId: string; packName: string }) {
  return requestBackend<{
    qr_string: string;
    md5: string;
    amount_cents: number;
    currency: string;
  }>("/api/payments/khqr/create", {
    method: "POST",
    body: {
      pack_id: params.packId,
      pack_name: params.packName,
    },
  });
}
/** `fulfilled` means the server already granted this checkout. When it is
 * false on a paid QR, this server could not fulfil it and the browser falls
 * back to asking for the grant itself. */
export function getKhqrStatus(md5: string, startTime: number) {
  return requestBackend<{
    status: "pending" | "paid";
    next_delay_seconds: number;
    fulfilled?: boolean;
  }>(`/api/payments/khqr/status/${md5}?start_time=${startTime}`);
}
