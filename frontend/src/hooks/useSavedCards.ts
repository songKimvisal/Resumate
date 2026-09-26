import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSavedCards,
  removeSavedCard,
  startLinkCard,
  syncLinkedCard,
  type SavedCard,
} from "../lib/api/cards";
import {
  closePaywayModal,
  openPaywayLinkCard,
  PAYWAY_CLOSED_EVENT,
} from "../lib/api/payway";

const LINK_POLL_MS = 3000;
const LINK_POLL_LIMIT_MS = 5 * 60 * 1000;

export function useSavedCards(onLinked?: (card: SavedCard) => void) {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkFailed, setLinkFailed] = useState(false);
  const pollRef = useRef<number | null>(null);
  const onLinkedRef = useRef(onLinked);
  useEffect(() => {
    onLinkedRef.current = onLinked;
  });

  const stopPolling = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const refresh = useCallback(
    () =>
      getSavedCards()
        .then((res) => {
          setCards(res.cards);
          setEnabled(res.enabled);
        })
        .catch((err) => console.warn("Could not load saved cards:", err))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void refresh();
    return stopPolling;
  }, [refresh]);

  useEffect(() => {
    const onClosed = () => {
      stopPolling();
      setLinking(false);
    };
    window.addEventListener(PAYWAY_CLOSED_EVENT, onClosed);
    return () => window.removeEventListener(PAYWAY_CLOSED_EVENT, onClosed);
  }, []);

  const linked = (card: SavedCard) => {
    stopPolling();
    closePaywayModal();
    setCards((current) => [card, ...current.filter((c) => c.id !== card.id)]);
    setLinking(false);
    onLinkedRef.current?.(card);
  };

  /** Polls until PayWay has issued this request's token. */
  const watchLink = useCallback((requestId: string) => {
    stopPolling();
    const startedAt = Date.now();
    pollRef.current = window.setInterval(() => {
      if (Date.now() - startedAt > LINK_POLL_LIMIT_MS) {
        stopPolling();
        setLinking(false);
        return;
      }
      syncLinkedCard(requestId)
        .then((res) => {
          if (res.linked && res.card) linked(res.card);
        })
        .catch((err) => console.warn("Saved card check failed:", err));
    }, LINK_POLL_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCard = async () => {
    if (linking) return;
    setLinking(true);
    setLinkFailed(false);
    try {
      const { request_id, action_url, fields } = await startLinkCard();
      watchLink(request_id);
      await openPaywayLinkCard(action_url, fields);
    } catch (err) {
      console.warn("Could not start saving a card:", err);
      stopPolling();
      setLinking(false);
      setLinkFailed(true);
    }
  };

  const removeCard = async (cardId: string) => {
    await removeSavedCard(cardId);
    setCards((current) => current.filter((c) => c.id !== cardId));
  };

  return {
    cards,
    loading,
    enabled,
    linking,
    linkFailed,
    addCard,
    removeCard,
    watchLink,
  };
}
