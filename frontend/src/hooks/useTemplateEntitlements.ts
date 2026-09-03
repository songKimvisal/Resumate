import { useEffect } from "react";
import { useAuth } from "./UseAuth";
import {
  applyTemplateEntitlements,
  getTemplateEntitlements,
} from "../lib/api/templates";

export function useHydrateTemplateEntitlements() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getTemplateEntitlements()
      .then((entitlements) => {
        if (!cancelled) applyTemplateEntitlements(entitlements);
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);
}
