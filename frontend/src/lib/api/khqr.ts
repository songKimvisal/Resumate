import { requestBackend } from "./client";

export function createKhqrPayment(params: {
  packId: string;
  packName: string;
  amountCents: number;
  currency?: string;
}) {
  return requestBackend<{ qr_string: string; md5: string }>(
    "/api/payments/khqr/create",
    {
      method: "POST",
      body: {
        pack_id: params.packId,
        pack_name: params.packName,
        amount_cents: params.amountCents,
        currency: params.currency ?? "USD",
      },
    },
  );
}
export function getKhqrStatus(md5: string, startTime: number) {
  return requestBackend<{
    status: "pending" | "paid";
    next_delay_seconds: number;
  }>(`/api/payments/khqr/status/${md5}?start_time=${startTime}`);
}
