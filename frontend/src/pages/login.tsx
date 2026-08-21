import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/UseAuth";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/button";
import logo from "../assets/logo/resumate.png";
import logoMobile from "../assets/logo/logo.png";
import { getPendingPlan, clearPendingPlan } from "../lib/session";

export default function Login() {
  const { user, loading, signInWithGoogle, signInWithPassword } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : t("login.errorInvalidCredentials"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">{t("common.loading")}</p>
      </div>
    );
  }

  // Already signed in → skip the login page
  if (user) {
    const pendingPlan = getPendingPlan();
    if (pendingPlan) {
      clearPendingPlan();
      return (
        <Navigate to="/billing/payment" state={{ plan: pendingPlan }} replace />
      );
    }
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 lg:p-10">
      <div className="lg:min-h-[707px] w-full max-w-6xl grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-line shadow-sm">
        {/* ============ Left panel — brand ============ */}
        <div className="relative hidden lg:flex flex-col justify-between bg-brand text-white p-12 overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10" />

          {/* logo */}
          <img
            src={logo}
            alt="ResuMate"
            className="relative h-14 w-auto self-start"
          />

          {/* headline */}
          <div className="relative space-y-6">
            <h2 className="text-5xl font-bold leading-tight w-[284px]">
              {t("login.headline")}{" "}
              <span className="italic">{t("login.headlineAccent")}</span>
            </h2>
            <p className="text-white/85 text-lg max-w-md">{t("login.pitch")}</p>
          </div>

          {/* stats */}
          <div className="relative border-t border-white/30 pt-8 grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-white/85 text-sm">{t("login.statFeatures")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">10</p>
              <p className="text-white/85 text-sm">
                {t("login.statTemplates")}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">EN/KH</p>
              <p className="text-white/85 text-sm">
                {t("login.statBilingual")}
              </p>
            </div>
          </div>
        </div>

        {/* ============ Right panel — sign in ============ */}
        <div className="bg-bg flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-sm space-y-8">
            {/* logo shown on mobile only, since left panel is hidden */}
            <img
              src={logoMobile}
              alt="ResuMate"
              className="h-12 w-auto lg:hidden"
            />

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-text">
                {t("login.welcome")}{" "}
                <span className="text-brand italic">
                  {t("login.welcomeAccent")}
                </span>
              </h1>
              <p className="text-text-secondary">{t("login.subtitle")}</p>
            </div>

            <button
              onClick={() => signInWithGoogle(from)}
              className="w-full flex items-center justify-center gap-3 bg-bg border border-line text-text font-medium px-4 py-3.5 rounded-xl hover:bg-surface-2 transition-colors"
            >
              {/* Google "G" in official colors */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              {t("login.google")}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-text-placeholder uppercase">
                {t("login.orDivider")}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label={t("login.emailLabel")}
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div className="space-y-1.5">
                <PasswordInput
                  label={t("login.passwordLabel")}
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  error={error ?? undefined}
                  required
                />
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand hover:underline"
                  >
                    {t("login.forgotPassword")}
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? t("login.submitting") : t("login.submit")}
              </Button>
            </form>

            <p className="text-sm text-text-secondary">
              {t("login.noAccount")}{" "}
              <Link to="/signup" className="text-brand hover:underline">
                {t("login.signUpLink")}
              </Link>
            </p>

            <p className="text-sm text-text-placeholder">
              {t("login.termsPrefix")}{" "}
              <a href="/terms" className="text-brand hover:underline">
                {t("login.termsLink")}
              </a>{" "}
              {t("login.termsAnd")}{" "}
              <a href="/privacy" className="text-brand hover:underline">
                {t("login.privacyLink")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
