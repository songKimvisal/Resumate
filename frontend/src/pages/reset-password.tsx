import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthError } from "@supabase/supabase-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/UseAuth";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/button";
import logoMobile from "../assets/logo/logo.png";

export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">{t("common.loading")}</p>
      </div>
    );
  }

  // No recovery session - the link was invalid, expired, or already used.
  if (!session && !done) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <img src={logoMobile} alt="ResuMate" className="h-12 w-auto mx-auto" />
          <h1 className="text-2xl font-bold text-text">
            {t("resetPassword.invalidTitle")}
          </h1>
          <p className="text-text-secondary">
            {t("resetPassword.invalidBody")}
          </p>
          <Link to="/forgot-password" className="text-brand hover:underline">
            {t("resetPassword.requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("resetPassword.errorPasswordLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("resetPassword.errorPasswordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : t("resetPassword.errorGeneric"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 lg:p-10">
      <div className="w-full max-w-sm space-y-8">
        <img src={logoMobile} alt="ResuMate" className="h-12 w-auto" />

        {done ? (
          <div className="space-y-3">
            <div className="size-12 rounded-full bg-success/10 text-success inline-flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <h1 className="text-2xl font-bold text-text">
              {t("resetPassword.successTitle")}
            </h1>
            <p className="text-text-secondary">
              {t("resetPassword.successBody")}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-text">
                {t("resetPassword.title")}
              </h1>
              <p className="text-text-secondary">
                {t("resetPassword.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                id="reset-password"
                name="password"
                label={t("resetPassword.passwordLabel")}
                placeholder={t("resetPassword.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                label={t("resetPassword.confirmPasswordLabel")}
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={error ?? undefined}
                required
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting
                  ? t("resetPassword.submitting")
                  : t("resetPassword.submit")}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
