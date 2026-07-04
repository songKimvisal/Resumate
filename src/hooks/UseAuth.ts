import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Keep session in sync (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);

      // Clean up the leftover "#" from the OAuth redirect
      if (event === "SIGNED_IN" && window.location.hash === "#") {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

  const signOut = () => supabase.auth.signOut();

  const user: User | null = session?.user ?? null;

  return { session, user, loading, signInWithGoogle, signOut };
}
