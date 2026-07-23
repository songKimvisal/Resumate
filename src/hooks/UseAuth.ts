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

  const signInWithGoogle = (redirectPath?: string) =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath ?? ""}`,
      },
    });

  const signUpWithPassword = (email: string, password: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

  const signInWithPassword = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const resetPasswordForEmail = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  const updatePassword = (password: string) =>
    supabase.auth.updateUser({ password });

  const signOut = () => supabase.auth.signOut();

  const user: User | null = session?.user ?? null;

  return {
    session,
    user,
    loading,
    signInWithGoogle,
    signUpWithPassword,
    signInWithPassword,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  };
}
