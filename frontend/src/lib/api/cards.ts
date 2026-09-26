import { requestBackend } from "./client";

/** The token itself stays on the server. */
export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expires_at: string | null;
}

/** "2028-09-30T00:00:00" -> "09/28". */
export function formatCardExpiry(iso: string | null) {
  const match = iso?.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[2]}/${match[1].slice(2)}` : "";
}

export function getSavedCards() {
  return requestBackend<{ enabled: boolean; cards: SavedCard[] }>(
    "/api/payments/cards",
  );
}

export function startLinkCard() {
  return requestBackend<{
    request_id: string;
    action_url: string;
    fields: Record<string, string>;
  }>("/api/payments/cards/link", { method: "POST", body: {} });
}

export function syncLinkedCard(requestId: string) {
  return requestBackend<{ linked: boolean; card: SavedCard | null }>(
    `/api/payments/cards/sync/${requestId}`,
    { method: "POST", body: {} },
  );
}

export function removeSavedCard(cardId: string) {
  return requestBackend<{ removed: boolean }>(`/api/payments/cards/${cardId}`, {
    method: "DELETE",
  });
}

/** The server prices the SKU and charges the card. */
export function payWithSavedCard(params: {
  packId: string;
  packName: string;
  cardId: string;
}) {
  return requestBackend<{
    tran_id: string;
    status: "pending" | "paid" | "declined" | "cancelled";
    fulfilled: boolean;
  }>("/api/payments/payway/pay-saved-card", {
    method: "POST",
    body: {
      pack_id: params.packId,
      pack_name: params.packName,
      card_id: params.cardId,
    },
  });
}
