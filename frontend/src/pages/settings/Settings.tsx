import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { useTheme } from "../../hooks/UseTheme";
import { supabase } from "../../lib/supabase";
import { deleteAllResumes } from "../../lib/api";
import { useResumeStore } from "../../store/resumeStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { cn } from "../../lib/utils";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const initialName =
    (user?.user_metadata?.full_name as string | undefined) ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const dirty = trimmedName !== initialName;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!trimmedName || !dirty) return;

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });
      if (error) throw error;
      setSaved(true);
    } catch {
      setError(t("settings.profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAllResumes(user.id);
      useResumeStore.getState().resetResume();
      await signOut();
      navigate("/");
    } catch {
      setDeleteError(t("settings.deleteAccount.error"));
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
      <p className="text-sm text-text-secondary mt-1">
        {t("settings.subtitle")}
      </p>

      <form
        onSubmit={handleSave}
        className="mt-8 w-full max-w-lg rounded-2xl border border-line p-4 sm:p-6 space-y-5"
      >
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={trimmedName || user?.email || ""}
              referrerPolicy="no-referrer"
              className="size-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="size-14 rounded-full bg-brand text-white inline-flex items-center justify-center text-lg font-semibold shrink-0">
              {(trimmedName || user?.email || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-text truncate">
              {trimmedName || user?.email}
            </p>
            <p className="text-sm text-text-secondary truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <Input
          id="settings-name"
          name="name"
          autoComplete="name"
          label={t("settings.profile.nameLabel")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder={t("settings.profile.namePlaceholder")}
          error={error ?? undefined}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="compact"
            disabled={saving || !dirty || !trimmedName}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving
              ? t("settings.profile.saving")
              : t("settings.profile.save")}
          </Button>
          {saved && !dirty && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 size={15} strokeWidth={2} />
              {t("settings.profile.saved")}
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 w-full max-w-lg rounded-2xl border border-line p-4 sm:p-6 space-y-5">
        <h2 className="font-bold">{t("settings.preference.title")}</h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text">
              {t("settings.preference.languageLabel")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {t("settings.preference.languageDesc")}
            </p>
          </div>
          <div className="inline-flex self-start sm:self-auto shrink-0 rounded-full bg-surface-2 p-1">
            {(["en", "km"] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => i18n.changeLanguage(lng)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  i18n.language === lng
                    ? "bg-bg text-text shadow-sm"
                    : "text-text-secondary",
                )}
              >
                {lng === "en" ? "EN" : "ខ្មែរ"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text">
              {t("settings.preference.themeLabel")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {t("settings.preference.themeDesc")}
            </p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            ariaLabel={t("settings.preference.themeLabel")}
          />
        </div>
      </div>

      <div className="mt-6 w-full max-w-lg rounded-2xl border border-destructive/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-destructive">
              {t("settings.deleteAccount.title")}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {t("settings.deleteAccount.description")}
            </p>
          </div>
          {!confirmingDelete && (
            <Button
              size="compact"
              variant="destructive"
              className="shrink-0 self-start sm:self-auto"
              onClick={() => setConfirmingDelete(true)}
            >
              {t("settings.deleteAccount.delete")}
            </Button>
          )}
        </div>

        {confirmingDelete && (
          <div className="mt-4 pt-4 border-t border-line space-y-3">
            <p className="text-sm text-text-secondary">
              {t("settings.deleteAccount.confirm")}
            </p>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="compact"
                variant="destructive"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting
                  ? t("settings.deleteAccount.deleting")
                  : t("settings.deleteAccount.confirmYes")}
              </Button>
              <Button
                size="compact"
                variant="outline"
                disabled={deleting}
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteError(null);
                }}
              >
                {t("settings.deleteAccount.confirmCancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
