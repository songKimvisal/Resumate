import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, FileText, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button";
import JourneyLayout from "../../components/dashboard/JourneyLayout";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import ResumePreviewOverlay from "../../components/resume/ResumePreviewOverlay";
import { useAuth } from "../../hooks/UseAuth";
import { useJourneyResume } from "../../hooks/useJourneyResume";
import { useJourneyStore, useJourneyDraft, practicedIdsOf } from "../../store/journeyStore";
import { computeJobMatch, requirementKeywords } from "../../lib/jobMatch";
import { computeCompleteness } from "../../lib/resumeCompleteness";
import {
  buildFallbackAnalysis,
  interviewReadinessLabel,
  overallReadinessScore,
  withNormalizedQuestions,
} from "../../lib/jobAnalysis";
import {
  downloadResumePdf,
  isDownloadAbort,
} from "../../lib/downloadResumePdf";
import { cn } from "../../lib/utils";

const GAUGE_RADIUS = 42;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/** Job readiness report as step 4 of the job-readiness journey. */
export default function JobReadiness() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resume, loading } = useJourneyResume();
  const reachStep = useJourneyStore((s) => s.reachStep);
  const saveDraft = useJourneyStore((s) => s.saveDraft);
  const getDraft = useJourneyStore((s) => s.getDraft);
  const draft = useJourneyDraft(user?.id, resume.id);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !resume.id) return;
    const current = getDraft(user.id, resume.id);
    if (!current.analysis && !current.jobText) {
      navigate("/job-match", { replace: true });
      return;
    }
    if (!current.analysis && current.jobText) {
      saveDraft(user.id, resume.id, {
        analysis: buildFallbackAnalysis(current.jobText, resume),
      });
    }
    reachStep(user.id, resume.id, 3);
  }, [loading, user?.id, resume.id, getDraft, saveDraft, reachStep, navigate]);

  const analysis = draft?.analysis;
  const pack = useMemo(() => {
    if (analysis) return withNormalizedQuestions(analysis, resume);
    if (draft?.jobText && resume.id) {
      return buildFallbackAnalysis(draft.jobText, resume);
    }
    return undefined;
  }, [analysis, draft?.jobText, resume]);
  const jobText = draft?.jobText ?? "";
  const practiced = practicedIdsOf(draft);

  const resumeQuality = useMemo(
    () => computeCompleteness(resume).score,
    [resume],
  );
  const match = useMemo(
    () =>
      jobText.trim()
        ? computeJobMatch(
            jobText,
            resume,
            requirementKeywords(jobText, pack),
          )
        : null,
    [jobText, resume, pack],
  );
  const jobMatchScore = match?.score ?? pack?.matchScore ?? 0;
  const skillGaps = match?.missing.length ?? pack?.missing.length ?? 0;
  const questions = pack?.questions ?? [];
  const practicedCount = questions.filter((q) =>
    practiced.includes(q.id),
  ).length;
  const interviewPercent =
    questions.length > 0
      ? Math.round((practicedCount / questions.length) * 100)
      : 0;
  const interviewBand = interviewReadinessLabel(
    practicedCount,
    questions.length,
  );
  const overall = overallReadinessScore({
    resumeQuality,
    jobMatch: jobMatchScore,
    interviewPercent,
  });

  const resumeLabel =
    resume.title ||
    resume.personal.fullName ||
    t("dashboard.untitledResume");

  const headline =
    pack?.readiness.headline ||
    t(
      overall >= 70
        ? "jobReadiness.headlineHigh"
        : overall >= 40
          ? "jobReadiness.headlineMid"
          : "jobReadiness.headlineLow",
    );
  const summary =
    pack?.readiness.summary || t("jobReadiness.summaryFallback");
  const actions =
    pack?.readiness.actions?.length
      ? pack.readiness.actions
      : [
          t("jobReadiness.fallbackActionPractice"),
          t("jobReadiness.fallbackActionSkills"),
          t("jobReadiness.fallbackActionPdf"),
        ];

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadResumePdf(resume);
    } catch (err) {
      if (!isDownloadAbort(err)) {
        setDownloadError(t("builder.downloadPdfError"));
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !resume.id || !pack) {
    return (
      <div className="flex items-center justify-center px-4 py-24 text-text-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="ml-3 text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <JourneyLayout
      activeIndex={3}
      backLabel={t("jobReadiness.back")}
      onBack={() => navigate("/job-match/interview-prep")}
    >
      <section className="min-w-0 rounded-2xl border border-line bg-bg p-3.5 shadow-sm min-[375px]:p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
          <ReadyDonut score={overall} />
          <div className="min-w-0 w-full">
            {resumeQuality >= 80 && (
              <span className="inline-flex rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                {t("jobReadiness.strongResume")}
              </span>
            )}
            <h2 className="mt-2 break-words text-lg font-extrabold tracking-tight text-text min-[375px]:text-xl sm:text-2xl">
              {headline}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-text-secondary sm:text-sm sm:leading-6">
              {summary}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 min-[375px]:gap-2.5 sm:mt-4 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          label={t("jobReadiness.metrics.resumeQuality")}
          value={`${resumeQuality}/100`}
        />
        <MetricCard
          label={t("jobReadiness.metrics.jobMatch")}
          value={`${jobMatchScore}%`}
        />
        <MetricCard
          label={t("jobReadiness.metrics.skillGaps")}
          value={String(skillGaps)}
        />
        <MetricCard
          label={t("jobReadiness.metrics.interviewReadiness")}
          value={t(`jobReadiness.interviewLabels.${interviewBand}`)}
        />
      </div>

      <div className="mt-3 grid min-w-0 gap-3 sm:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(160px,220px)] lg:items-start lg:gap-5">
        <section className="min-w-0 rounded-2xl border border-line bg-bg p-3.5 shadow-sm min-[375px]:p-4 sm:p-5">
          <h3 className="text-sm font-bold text-brand">
            {t("jobReadiness.recommended")}
          </h3>
          <ul className="mt-3 space-y-2 min-[375px]:space-y-2.5">
            {actions.map((action, i) => (
              <li
                key={`${i}-${action.slice(0, 24)}`}
                className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2/30 px-3 py-2.5 min-[375px]:gap-3 min-[375px]:px-3.5 min-[375px]:py-3"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-brand text-[11px] font-bold text-brand">
                  {i + 1}
                </span>
                <span className="min-w-0 break-words text-[13px] leading-5 text-text sm:text-sm">
                  {action}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group hidden w-full overflow-hidden rounded-xl border border-line bg-surface-2 p-2 text-left shadow-sm transition-colors hover:border-brand/40 cursor-zoom-in lg:block"
          >
            <ScaledResumePreview resume={resume} />
            <p className="mt-2 truncate px-0.5 text-center text-[11px] font-medium text-text">
              {resumeLabel}
            </p>
            <p className="mt-0.5 text-center text-[10px] text-text-secondary group-hover:text-brand">
              {t("jobMatch.results.viewPreview")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-brand/40 cursor-zoom-in lg:hidden"
          >
            <div className="w-14 shrink-0 overflow-hidden rounded-lg shadow-sm min-[375px]:w-[4.25rem]">
              <ScaledResumePreview resume={resume} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                {resumeLabel}
              </p>
              <p className="mt-0.5 text-xs text-brand">
                {t("jobMatch.results.viewPreview")}
              </p>
            </div>
          </button>
          <Button
            size="compact"
            className="h-9 w-full rounded-full lg:mt-3"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            <span className="truncate">
              {downloading
                ? t("jobReadiness.downloading")
                : t("jobReadiness.downloadPdf")}
            </span>
          </Button>
          {downloadError && (
            <p className="mt-2 text-xs text-destructive">{downloadError}</p>
          )}
        </div>
      </div>

      <ResumePreviewOverlay
        resume={resume}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeLabel={t("jobMatch.results.closePreview")}
      />
    </JourneyLayout>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-bg p-3 shadow-sm min-[375px]:p-3.5 sm:p-4">
      <p className="text-[9px] font-semibold uppercase leading-tight tracking-[0.08em] text-text-secondary min-[375px]:text-[10px] min-[375px]:tracking-[0.12em] sm:text-[11px]">
        {label}
      </p>
      <div className="mt-2 flex min-w-0 items-center gap-1.5 min-[375px]:gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand min-[375px]:size-7">
          <FileText size={13} />
        </span>
        <p className="min-w-0 break-words text-sm font-extrabold leading-tight text-text min-[375px]:truncate min-[375px]:text-base sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}

function ReadyDonut({ score }: { score: number }) {
  const { t } = useTranslation();
  const offset = GAUGE_CIRCUMFERENCE * (1 - score / 100);
  const strong = score >= 70;

  return (
    <div className="relative mx-auto size-[100px] shrink-0 min-[375px]:size-[120px] sm:mx-0 sm:size-[132px]">
      <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="48"
          cy="48"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-line"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          initial={{ strokeDashoffset: GAUGE_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 55, damping: 16, delay: 0.15 }}
          className={strong ? "text-success" : "text-brand"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-xl font-extrabold tabular-nums leading-none sm:text-2xl",
            strong ? "text-success" : "text-brand",
          )}
        >
          {score}%
        </span>
        <span
          className={cn(
            "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
            strong ? "text-success/80" : "text-brand/80",
          )}
        >
          {t("jobReadiness.readyWord")}
        </span>
      </div>
    </div>
  );
}
