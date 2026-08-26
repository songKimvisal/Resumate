import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthError } from "@supabase/supabase-js";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "../hooks/UseAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/button";
import logoMobile from "../assets/logo/logo.png";

export default function ForgotPassword() {
  const { user, loading, resetPasswordForEmail } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
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

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : t("forgotPassword.errorGeneric"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 lg:p-10">
      <div className="w-full max-w-sm space-y-8">
        <img src={logoMobile} alt="ResuMate" className="h-12 w-auto" />

        {submitted ? (
          <div className="space-y-5">
            <div className="size-12 rounded-full bg-brand/10 text-brand inline-flex items-center justify-center">
              <MailCheck size={22} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text">
                {t("forgotPassword.checkEmailTitle")}
              </h1>
              <p className="text-text-secondary">
                {t("forgotPassword.checkEmailBody", { email })}
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-brand hover:underline text-sm"
            >
              <ArrowLeft size={15} />
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-text">
                {t("forgotPassword.title")}
              </h1>
              <p className="text-text-secondary">
                {t("forgotPassword.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="forgot-email"
                name="email"
                type="email"
                label={t("forgotPassword.emailLabel")}
                placeholder={t("forgotPassword.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={error ?? undefined}
                required
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting
                  ? t("forgotPassword.submitting")
                  : t("forgotPassword.submit")}
              </Button>
            </form>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text"
            >
              <ArrowLeft size={15} />
              {t("forgotPassword.backToLogin")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
