import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./UseAuth";
import { useResumeStore } from "../store/resumeStore";
import { useJourneyStore, useJourneyHydrated } from "../store/journeyStore";
import { getResumesByUser } from "../lib/api";

/** Loads the journey resume into the store (needed after a refresh on later steps). */
export function useJourneyResume() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const journeyHydrated = useJourneyHydrated();
  const lastResumeId = useJourneyStore((s) =>
    s.lastUserId === user?.id ? s.lastResumeId : null,
  );
  const [loading, setLoading] = useState(!resume?.id);

  useEffect(() => {
    if (!user) return;
    if (!journeyHydrated) return;
    if (resume?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getResumesByUser(user.id)
      .then((data) => {
        if (cancelled) return;
        const preferred =
          data.find((item) => item.resume.id === lastResumeId)?.resume ??
          data[0]?.resume;
        if (preferred) setResume(preferred);
        else navigate("/select-resume");
      })
      .catch(() => {
        if (!cancelled) navigate("/dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    user,
    resume?.id,
    setResume,
    navigate,
    journeyHydrated,
    lastResumeId,
  ]);

  return { resume, loading: loading || !journeyHydrated, journeyHydrated };
}
