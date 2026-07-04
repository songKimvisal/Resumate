import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/UseAuth";

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">{t("common.loading")}</p>
      </div>
    );
  }

  // Already signed in → skip the login page
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-brand">ResuMate</h1>
          <p className="text-text-secondary">{t("login.subtitle")}</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-brand text-white font-medium px-4 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z"
              fill="currentColor"
              opacity=".95"
            />
            <path
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-4.9l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24z"
              fill="currentColor"
              opacity=".8"
            />
            <path
              d="M5.2 14.5c-.25-.7-.4-1.5-.4-2.3s.15-1.6.4-2.3l-.01-.16-3.7-2.8-.12.06C.5 8.6 0 10.2 0 12s.5 3.4 1.4 4.9l3.8-2.4z"
              fill="currentColor"
              opacity=".65"
            />
            <path
              d="M12 4.6c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l3.8 2.9C6.2 6.7 8.8 4.6 12 4.6z"
              fill="currentColor"
              opacity=".9"
            />
          </svg>
          {t("login.google")}
        </button>

        <p className="text-center text-sm text-text-placeholder">
          {t("login.terms")}
        </p>
      </div>
    </div>
  );
}
