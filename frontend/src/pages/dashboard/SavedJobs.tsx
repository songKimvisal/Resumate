import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import SelectBar from "../../components/dashboard/SelectBar";
import PageTitle from "../../components/layout/PageTitle";
import UsageQuotaBanner from "../../components/dashboard/UsageQuotaBanner";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { getResumesByUser, type DashboardResume } from "../../lib/api";
import {
  displayJobCompany,
  displayJobTitle,
  overallReadinessScore,
} from "../../lib/jobAnalysis";
import { prettyProperName } from "../../lib/interviewSet";
import { computeCompleteness } from "../../lib/resumeCompleteness";
import { cn } from "../../lib/utils";
import {
  reviewableJobsForUser,
  useJourneyHydrated,
  useJourneyStore,
  type ReviewableJob,
} from "../../store/journeyStore";
import type { Resume } from "../../types/resume";
import mascot from "../../assets/logo/mascot.png";

function jobCardId(job: ReviewableJob) {
  return `${job.resumeId}:${job.id}`;
}

/** Sidebar Saved jobs hub: one card per saved job, then report or interview Q&A. */
export default function SavedJobs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hydrated = useJourneyHydrated();
  const setResume = useResumeStore((s) => s.setResume);
  const byKey = useJourneyStore((s) => s.byKey);
  const rememberResume = useJourneyStore((s) => s.rememberResume);
  const activateSavedJob = useJourneyStore((s) => s.activateSavedJob);
  const removeJob = useJourneyStore((s) => s.removeJob);

  const [resumes, setResumes] = useState<DashboardResume[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  const fetchResumes = useCallback((userId: string) => {
    getResumesByUser(userId)
      .then((data) => {
        setResumes(data);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (user) fetchResumes(user.id);
  }, [user, fetchResumes]);

  const cards = useMemo(() => {
    if (!user || !resumes) return [];
    const resumeById = new Map<string, Resume>();
    for (const item of resumes) {
      if (item.resume.id) resumeById.set(item.resume.id, item.resume);
    }
    return reviewableJobsForUser(byKey, user.id).flatMap((job) => {
      const resume = resumeById.get(job.resumeId);
      if (!resume) return [];
      const questions = job.analysis?.questions ?? [];
      const practiced = questions.filter((q) =>
        (job.practicedQuestionIds ?? []).includes(q.id),
      ).length;
      const interviewPercent =
        questions.length > 0
          ? Math.round((practiced / questions.length) * 100)
          : 0;
      return [
        {
          job,
          resume,
          overall: overallReadinessScore({
            resumeQuality: computeCompleteness(resume).score,
            jobMatch: job.matchScore,
            interviewPercent,
          }),
          practiced,
          total: questions.length,
        },
      ];
    });
  }, [user, resumes, byKey]);

  const selectableIds = cards.map(({ job }) => jobCardId(job));
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  const exitSelectMode = () => {
    setSelecting(false);
    setSelectedIds([]);
    setConfirmingBulk(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selected) => selected !== id)
        : [...prev, id],
    );
  };

  const activateJob = (resume: Resume, job: ReviewableJob) => {
    if (!user || !resume.id) return false;
    setResume(resume);
    rememberResume(user.id, resume.id);
    activateSavedJob(user.id, resume.id, job.id);
    return true;
  };

  const openReport = (resume: Resume, job: ReviewableJob) => {
    if (!activateJob(resume, job)) return;
    navigate("/job-readiness?from=saved-jobs", {
      state: { from: "saved-jobs" },
    });
  };

  const handleBulkDelete = () => {
    if (!user || selectedIds.length === 0) return;
    for (const card of cards) {
      const id = jobCardId(card.job);
      if (!selectedIds.includes(id) || !card.resume.id) continue;
      removeJob(user.id, card.resume.id, card.job.id);
    }
    exitSelectMode();
  };

  if (!hydrated || resumes === null) {
    return (
      <div className="flex items-center justify-center px-4 py-24 text-text-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="ml-3 text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 sm:px-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageTitle
            text={t("savedJobsPage.hubTitle")}
            accent={t("savedJobsPage.hubTitleAccent")}
          />
          <p className="mt-2 text-sm text-text-secondary">
            {t("savedJobsPage.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:mt-1">
          <UsageQuotaBanner kind="reports" />
          {cards.length > 0 && !loadError && !selecting ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelecting(true)}
              >
                {t("myResumes.select")}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                {t("savedJobsPage.analyzeCta")}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {selecting && cards.length > 0 ? (
        <SelectBar
          selectedCount={selectedIds.length}
          allSelected={allSelected}
          confirming={confirmingBulk}
          selectHint={t("savedJobsPage.selectHint")}
          confirmMessage={t("savedJobsPage.confirmDeleteSelected", {
            count: selectedIds.length,
          })}
          onToggleAll={() => setSelectedIds(allSelected ? [] : selectableIds)}
          onAskDelete={() => setConfirmingBulk(true)}
          onConfirmDelete={handleBulkDelete}
          onCancelConfirm={() => setConfirmingBulk(false)}
          onExit={exitSelectMode}
        />
      ) : null}

      {loadError ? (
        <div className="mt-6 rounded-2xl border border-line px-4 py-10 text-center sm:mt-8">
          <p className="text-sm text-text-secondary">{t("dashboard.loadError")}</p>
          <Button
            className="mt-4 h-9 rounded-full"
            size="compact"
            onClick={() => user && fetchResumes(user.id)}
          >
            {t("dashboard.retry")}
          </Button>
        </div>
      ) : cards.length === 0 ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-bg">
          <div className="flex flex-col items-center gap-5 px-4 py-8 min-[375px]:px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-8 sm:py-8">
            <img
              src={mascot}
              alt=""
              className="w-24 shrink-0 select-none min-[375px]:w-28 sm:w-36 lg:w-40"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-base font-bold tracking-tight text-text sm:text-lg">
                {t("savedJobsPage.unlockTitle")}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-text-secondary sm:max-w-none">
                {t("savedJobsPage.unlockBody")}
              </p>
              <Button
                className="mt-4 h-9 rounded-full"
                size="compact"
                onClick={() => navigate("/dashboard")}
              >
                {t("savedJobsPage.unlockCta")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 min-[375px]:mt-6 sm:mt-8 sm:grid-cols-2 sm:gap-5">
          {cards.map(({ job, resume, overall, practiced, total }) => {
            const roleTitle =
              displayJobTitle(job.roleTitle, job.jobText) ||
              t("jobMatch.saved.untitled");
            const companyName = prettyProperName(
              displayJobCompany(job.jobText),
            );
            const heading =
              companyName && roleTitle
                ? t("jobMatch.roleAtCompany", {
                    role: roleTitle,
                    company: companyName,
                  })
                : companyName || roleTitle;
            const resumeName =
              resume.title || t("dashboard.untitledResume");
            const strong = overall >= 70;
            const cardId = jobCardId(job);
            const selected = selectedIds.includes(cardId);
            return (
              <li key={cardId} className="min-w-0">
                <div
                  className={cn(
                    "group relative flex h-full min-h-[7.25rem] w-full min-w-0 items-center gap-3.5 overflow-hidden rounded-2xl border bg-bg p-3.5 text-left shadow-sm min-[375px]:min-h-[7.75rem] min-[375px]:gap-4 min-[375px]:p-4 sm:min-h-[8.5rem] sm:p-[1.125rem]",
                    selected
                      ? "border-brand ring-2 ring-brand/40"
                      : "border-line",
                    selecting
                      ? "cursor-pointer"
                      : "transition-colors hover:border-brand/30 hover:bg-surface-2/40",
                  )}
                  {...(selecting
                    ? {
                        role: "button" as const,
                        tabIndex: 0,
                        "aria-pressed": selected,
                        onClick: () => toggleSelect(cardId),
                        onKeyDown: (event: KeyboardEvent) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleSelect(cardId);
                          }
                        },
                      }
                    : {})}
                >
                  {selecting ? (
                    <span
                      className={cn(
                        "absolute top-2.5 left-2.5 z-10 inline-flex size-6 items-center justify-center rounded-md border-2",
                        selected
                          ? "border-brand bg-brand text-white"
                          : "border-line bg-bg/90 text-transparent",
                      )}
                      aria-hidden
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  ) : null}
                  <div className="w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-line min-[375px]:w-[4.5rem] sm:w-20">
                    <ScaledResumePreview
                      resume={resume}
                      className="rounded-none border-0 shadow-none"
                    />
                  </div>
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-text sm:text-[15px]">
                      {heading}
                    </p>
                    <p className="mt-1 truncate text-xs text-text-secondary">
                      {resumeName}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-text-secondary sm:text-xs">
                      {total > 0
                        ? t("savedJobsPage.cardStats", {
                            match: job.matchScore,
                            done: practiced,
                            total,
                          })
                        : t("savedJobsPage.matchScore", {
                            score: job.matchScore,
                          })}
                    </p>
                    {!selecting ? (
                      <div className="mt-auto flex min-w-0 items-center justify-between gap-3 pt-3">
                        <p
                          className={cn(
                            "shrink-0 text-lg font-bold tabular-nums leading-none",
                            strong ? "text-success" : "text-brand",
                          )}
                        >
                          {overall}%
                        </p>
                        <Button
                          size="sm"
                          className="h-8 shrink-0 rounded-full px-3.5"
                          onClick={() => openReport(resume, job)}
                        >
                          <span className="truncate">
                            {t("savedJobsPage.continue")}
                          </span>
                          <ArrowRight size={14} strokeWidth={2.4} />
                        </Button>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "mt-auto pt-3 shrink-0 text-lg font-bold tabular-nums leading-none",
                          strong ? "text-success" : "text-brand",
                        )}
                      >
                        {overall}%
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
