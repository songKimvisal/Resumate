import { useEffect, useState } from "react";
import { useAuth } from "./UseAuth";
import {
  deleteJourney,
  getJourneysByUser,
  upsertJourney,
} from "../lib/api/journeys";
import {
  isMeaningfulDraft,
  parseStorageKey,
  useJourneyStore,
  type JourneyDraft,
} from "../store/journeyStore";

const SYNC_MS = 500;

function keysForUser(
  byKey: Record<string, JourneyDraft>,
  userId: string,
) {
  const prefix = `${userId}:`;
  return Object.keys(byKey).filter((key) => key.startsWith(prefix));
}

export function useHydrateJourneys() {
  const { user } = useAuth();
  const userId = user?.id;
  const [persistReady, setPersistReady] = useState(() =>
    useJourneyStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useJourneyStore.persist.hasHydrated()) {
      setPersistReady(true);
      return;
    }
    return useJourneyStore.persist.onFinishHydration(() =>
      setPersistReady(true),
    );
  }, []);

  useEffect(() => {
    if (!userId) {
      useJourneyStore.setState({ remoteHydrated: false });
      return;
    }
    if (!persistReady) return;

    let cancelled = false;
    getJourneysByUser(userId)
      .then(async (rows) => {
        if (cancelled) return;
        useJourneyStore.getState().hydrateFromCloud(userId, rows);
        const serverIds = new Set(rows.map((row) => row.resumeId));
        const { byKey } = useJourneyStore.getState();
        for (const key of keysForUser(byKey, userId)) {
          const resumeId = parseStorageKey(key, userId);
          if (!resumeId || serverIds.has(resumeId)) continue;
          const draft = byKey[key];
          if (isMeaningfulDraft(draft)) {
            await upsertJourney(userId, resumeId, draft).catch(() => {});
          }
        }
      })
      .catch(() => {
        // Keep local cache if the table is missing or the network is down.
      })
      .finally(() => {
        if (!cancelled) {
          useJourneyStore.setState({ remoteHydrated: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, persistReady]);

  useEffect(() => {
    if (!userId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const pending = new Set<string>();
    let prev = useJourneyStore.getState().byKey;

    const flush = () => {
      timer = null;
      const keys = [...pending];
      pending.clear();
      const { byKey } = useJourneyStore.getState();
      for (const key of keys) {
        const resumeId = parseStorageKey(key, userId);
        if (!resumeId) continue;
        const draft = byKey[key];
        if (isMeaningfulDraft(draft)) {
          void upsertJourney(userId, resumeId, draft).catch(() => {});
        } else {
          void deleteJourney(userId, resumeId).catch(() => {});
        }
      }
    };

    const unsub = useJourneyStore.subscribe((state) => {
      if (state.byKey === prev) return;
      const next = state.byKey;
      const old = prev;
      prev = next;
      const watched = new Set([
        ...keysForUser(old, userId),
        ...keysForUser(next, userId),
      ]);
      for (const key of watched) {
        if (old[key] === next[key]) continue;
        pending.add(key);
      }
      if (pending.size === 0) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, SYNC_MS);
    });

    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [userId]);
}
