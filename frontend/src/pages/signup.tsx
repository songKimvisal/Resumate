import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthError } from "@supabase/supabase-js";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "../hooks/UseAuth";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/button";
import logo from "../assets/logo/resumate.png";
import logoMobile from "../assets/logo/logo.png";
import { markStayOnHome, shouldStayOnHome, clearStayOnHome } from "../lib/session";

export default function Signup() {
  const { user, loading, signInWithGoogle, signUpWithPassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">{t("common.loading")}</p>
      </div>
    );
  }

  if (user) {
    if (shouldStayOnHome()) return <Navigate to="/" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("signup.errorPasswordLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("signup.errorPasswordMismatch"));
      return;
    }

    setSubmitting(true);
    markStayOnHome();
    try {
      const { data, error } = await signUpWithPassword(email, password);
      if (error) throw error;
      if (data.session) {
        navigate("/", { replace: true });
        return;
      }
      setSubmitted(true);
    } catch (err) {
      clearStayOnHome();
      setError(
        err instanceof AuthError ? err.message : t("signup.errorGeneric"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 lg:p-10">
      <div className="lg:min-h-[707px] w-full max-w-6xl grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-line shadow-sm">
        {/* ============ Left panel — brand ============ */}
        <div className="relative hidden lg:flex flex-col justify-between bg-brand text-white p-12 overflow-hidden">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10" />

          <img
            src={logo}
            alt="ResuMate"
            className="relative h-14 w-auto self-start"
          />

          <div className="relative space-y-6">
            <h2 className="text-5xl font-bold leading-tight w-[284px]">
              {t("signup.headline")}{" "}
              <span className="italic">{t("signup.headlineAccent")}</span>
            </h2>
            <p className="text-white/85 text-lg max-w-md">
              {t("signup.pitch")}
            </p>
          </div>

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

        {/* ============ Right panel — sign up ============ */}
        <div className="bg-bg flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-sm space-y-8">
            <img
              src={logoMobile}
              alt="ResuMate"
              className="h-12 w-auto lg:hidden"
            />

            {submitted ? (
              <div className="space-y-5">
                <div className="size-12 rounded-full bg-brand/10 text-brand inline-flex items-center justify-center">
                  <MailCheck size={22} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-text">
                    {t("signup.checkEmailTitle")}
                  </h1>
                  <p className="text-text-secondary">
                    {t("signup.checkEmailBody", { email })}
                  </p>
                </div>
                <Link to="/login" className="text-brand hover:underline text-sm">
                  {t("signup.backToLogin")}
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold text-text">
                    {t("signup.welcome")}{" "}
                    <span className="text-brand italic">
                      {t("signup.welcomeAccent")}
                    </span>
                  </h1>
                  <p className="text-text-secondary">{t("signup.subtitle")}</p>
                </div>

                <button
                  onClick={() => {
                    markStayOnHome();
                    void signInWithGoogle("/");
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-bg border border-line text-text font-medium px-4 py-3.5 rounded-xl hover:bg-surface-2 transition-colors"
                >
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
                    {t("signup.orDivider")}
                  </span>
                  <div className="h-px flex-1 bg-line" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    label={t("signup.emailLabel")}
                    placeholder={t("signup.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <PasswordInput
                    label={t("signup.passwordLabel")}
                    placeholder={t("signup.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <PasswordInput
                    label={t("signup.confirmPasswordLabel")}
                    placeholder={t("signup.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    error={error ?? undefined}
                    required
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {submitting
                      ? t("signup.submitting")
                      : t("signup.submit")}
                  </Button>
                </form>

                <p className="text-sm text-text-secondary">
                  {t("signup.hasAccount")}{" "}
                  <Link to="/login" className="text-brand hover:underline">
                    {t("signup.logInLink")}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
