import { requestBackend } from "./client";

export type Provider = "stripe" | "khqr";

/** A real pack purchase, or a flat a-la-carte SKU ("customization-unlock",
 * "template:<template_id>") for the one-time $1/$1.99 purchases. */
export type PaymentSku = string;

export interface PaymentRecord {
  id: string;
  pack_id: string;
  pack_name: string;
  provider: Provider;
  amount_cents: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  external_transaction_id: string | null;
  created_at: string;
}

export function getPaymentHistory() {
  return requestBackend<{ payments: PaymentRecord[] }>("/api/payments");
}

/** The server prices the SKU itself - the browser cannot name an amount. */
export function recordPayment(params: {
  packId: PaymentSku;
  packName: string;
  provider: Provider;
  externalTransactionId?: string;
}) {
  return requestBackend<PaymentRecord>("/api/payments/record", {
    method: "POST",
    body: {
      pack_id: params.packId,
      pack_name: params.packName,
      provider: params.provider,
      external_transaction_id: params.externalTransactionId ?? null,
    },
  });
}
