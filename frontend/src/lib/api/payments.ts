import { requestBackend } from "./client";
import type { PackId } from "../../types/billing";

export type Provider = "stripe" | "khqr";

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

export function recordPayment(params: {
  packId: PackId;
  packName: string;
  provider: Provider;
  amountCents: number;
  currency?: string;
  externalTransactionId?: string;
}) {
  return requestBackend<PaymentRecord>("/api/payments/record", {
    method: "POST",
    body: {
      pack_id: params.packId,
      pack_name: params.packName,
      provider: params.provider,
      amount_cents: params.amountCents,
      currency: params.currency ?? "USD",
      external_transaction_id: params.externalTransactionId ?? null,
    },
  });
}
