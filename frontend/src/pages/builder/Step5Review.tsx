import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { computeCompleteness } from "../../lib/resumeCompleteness";
import { downloadResumePdf } from "../../lib/downloadResumePdf";
import { saveResumeToDashboard } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import type { ScoreBand } from "../../lib/resumeCompleteness";

interface Step5ReviewProps {
  onGoToStep: (step: number) => void;
}

const BAND_LABEL_CLASS: Record<ScoreBand, string> = {
  excellent: "text-success",
  strong: "text-success",
  good: "text-amber-600",
  needsWork: "text-destructive",
};

const BAND_RING_CLASS: Record<ScoreBand, string> = {
  excellent: "text-success",
  strong: "text-success",
  good: "text-amber-500",
  needsWork: "text-destructive",
};

const BAND_ACCENT_CLASS: Record<ScoreBand, string> = {
  excellent: "border-l-success",
  strong: "border-l-success",
  good: "border-l-amber-500",
  needsWork: "border-l-destructive",
};

const BAND_ICON: Record<ScoreBand, LucideIcon> = {
  excellent: CheckCircle2,
  strong: CheckCircle2,
  good: AlertTriangle,
  needsWork: AlertCircle,
};

export default function Step5Review({ onGoToStep }: Step5ReviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const resume = useResumeStore((s) => s.resume);
  const markSaved = useResumeStore((s) => s.markSaved);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { score, band, missing } = computeCompleteness(resume);
  const circumference = 2 * Math.PI * 42;
  const BandIcon = BAND_ICON[band];

  const handleDownload = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setDownloading(true);
    try {
      await downloadResumePdf(resume);
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const id = await saveResumeToDashboard(resume, user.id);
      markSaved(id);
      setSaved(true);
    } catch {
      setSaveError(t("builder.review.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:px-6 lg:pr-10">
      <div>
        <h2 className="text-2xl font-bold">{t("builder.review.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.review.subtitle")}
        </p>
      </div>

      {/* ---------- score card ---------- */}
      <div
        className={cn(
          "rounded-2xl border border-line border-l-4 p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left",
          BAND_ACCENT_CLASS[band],
        )}
      >
        <div className="relative size-24 shrink-0">
          <svg viewBox="0 0 96 96" className="size-24 -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-line"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              className={cn(
                "transition-all duration-500",
                BAND_RING_CLASS[band],
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{score}%</span>
            <span className="text-[11px] text-text-secondary">
              {t("builder.review.scoreLabel")}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p
            className={cn(
              "flex items-center justify-center sm:justify-start gap-1.5 text-sm font-semibold",
              BAND_LABEL_CLASS[band],
            )}
          >
            <BandIcon size={15} strokeWidth={2} className="shrink-0" />
            {t(`builder.review.band.${band}.title`)}
          </p>
          <p className="font-semibold mt-1 text-lg">
            {t(`builder.review.band.${band}.message`)}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {missing.length > 0
              ? t("builder.review.fixItems", { count: missing.length })
              : t("builder.review.coversAll")}
          </p>
        </div>
      </div>

      {/* ---------- checklist ---------- */}
      {missing.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
              {t("builder.review.checklist")}
            </p>
            <span className="text-xs font-semibold text-brand">
              {missing.length}
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-3">
            {missing.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors hover:border-brand/40 hover:bg-surface-2"
              >
                <span className="flex size-9 shrink-0 items-center justify-center text-brand">
                  <AlertCircle size={18} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {t(`builder.review.items.${item.id}.title`)}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {t(`builder.review.items.${item.id}.description`)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 sm:ml-3"
                  onClick={() => onGoToStep(item.step)}
                >
                  {t("builder.review.fixInStep", { step: item.step })}
                  <ArrowRight size={14} strokeWidth={2} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- download / save ---------- */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
            {t("builder.review.download")}
          </p>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="rounded-2xl border border-line p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center text-brand">
              <Sparkles size={20} strokeWidth={2} />
            </span>
            <div>
              <p className="font-semibold">
                {t("builder.review.readyToDownload")}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {t("builder.review.readyToDownloadDesc")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button
              size="compact"
              className="flex-1 min-w-[200px] justify-center"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={15} strokeWidth={2} />
              {downloading
                ? t("builder.downloadingPdf")
                : t("builder.downloadPdf")}
            </Button>
            <Button
              size="compact"
              variant="outline"
              onClick={saved ? () => navigate("/my-resumes") : handleSave}
              disabled={saving}
            >
              {saved ? (
                <CheckCircle2 size={15} strokeWidth={2} />
              ) : (
                <LayoutDashboard size={15} strokeWidth={2} />
              )}
              {saving
                ? t("builder.review.saving")
                : saved
                  ? t("builder.review.goToDashboard")
                  : t("builder.review.saveToDashboard")}
            </Button>
          </div>
          {saveError && (
            <p className="text-sm text-destructive mt-3">{saveError}</p>
          )}
        </div>

        <p className="text-xs text-text-secondary mt-3 text-center">
          {t("builder.review.pdfNote")}
        </p>
      </div>
    </div>
  );
}
