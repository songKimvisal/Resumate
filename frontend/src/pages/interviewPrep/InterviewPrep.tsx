import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import SelectBar from "../../components/dashboard/SelectBar";
import PageTitle from "../../components/layout/PageTitle";
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
import {
  interviewPrepForDraft,
  reviewableJobsOf,
  useJourneyHydrated,
  useJourneyStore,
} from "../../store/journeyStore";
import type { Resume } from "../../types/resume";
import { cn } from "../../lib/utils";
import mascot from "../../assets/logo/mascot.png";

/** Sidebar Interview prep hub: Saved-jobs-style cards, then open Q&A. */
export default function InterviewPrep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hydrated = useJourneyHydrated();
  const setResume = useResumeStore((s) => s.setResume);
  const byKey = useJourneyStore((s) => s.byKey);
  const getDraft = useJourneyStore((s) => s.getDraft);
  const rememberResume = useJourneyStore((s) => s.rememberResume);
  const activateSavedJob = useJourneyStore((s) => s.activateSavedJob);
  const clearResumeJobs = useJourneyStore((s) => s.clearResumeJobs);

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
    return resumes.flatMap((item) => {
      const resumeId = item.resume.id;
      if (!resumeId) return [];
      const draft = getDraft(user.id, resumeId);
      const prep = interviewPrepForDraft(draft);
      if (!prep) return [];
      const jobs = reviewableJobsOf(draft, resumeId);
      const withQuestions = jobs.filter(
        (job) => (job.analysis?.questions?.length ?? 0) > 0,
      ).length;
      const active =
        jobs.find((job) => job.id === prep.jobId) ?? jobs[0];
      const jobText = active?.jobText ?? draft?.jobText ?? "";
      const roleTitle =
        displayJobTitle(
          active?.roleTitle || draft?.analysis?.roleTitle,
          jobText,
        ) || "";
      const company = displayJobCompany(jobText);
      const matchScore =
        active?.matchScore ?? draft?.analysis?.matchScore ?? 0;
      const interviewPercent =
        prep.total > 0
          ? Math.round((prep.practiced / prep.total) * 100)
          : 0;
      return [
        {
          item,
          prep,
          roleTitle,
          company,
          matchScore,
          overall: overallReadinessScore({
            resumeQuality: computeCompleteness(item.resume).score,
            jobMatch: matchScore,
            interviewPercent,
          }),
          extraJobs: Math.max(0, withQuestions - 1),
        },
      ];
    });
  }, [user, resumes, byKey, getDraft]);

  const selectableIds = cards
    .map(({ item }) => item.resume.id)
    .filter((id): id is string => Boolean(id));
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

  const activateJob = (resume: Resume, jobId: string | null) => {
    if (!user || !resume.id) return false;
    setResume(resume);
    rememberResume(user.id, resume.id);
    if (jobId) activateSavedJob(user.id, resume.id, jobId);
    return true;
  };

  const openPrep = (resume: Resume, jobId: string | null) => {
    if (!activateJob(resume, jobId)) return;
    navigate("/job-match/interview-prep?from=hub", {
      state: { from: "hub" },
    });
  };

  const handleBulkDelete = () => {
    if (!user || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      clearResumeJobs(user.id, id);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageTitle
            text={t("interviewPrep.hubTitle")}
            accent={t("interviewPrep.hubTitleAccent")}
          />
          <p className="mt-2 text-sm text-text-secondary">
            {t("interviewPrep.hubSubtitle")}
          </p>
        </div>
        {cards.length > 0 && !loadError && !selecting ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelecting(true)}
          >
            {t("myResumes.select")}
          </Button>
        ) : null}
      </div>

      {selecting && cards.length > 0 ? (
        <SelectBar
          selectedCount={selectedIds.length}
          allSelected={allSelected}
          confirming={confirmingBulk}
          selectHint={t("interviewPrep.selectHint")}
          confirmMessage={t("interviewPrep.confirmDeleteSelected", {
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
                {t("interviewPrep.unlockTitle")}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-text-secondary sm:max-w-none">
                {t("interviewPrep.unlockBody")}
              </p>
              <Button
                className="mt-4 h-9 rounded-full"
                size="compact"
                onClick={() => navigate("/dashboard")}
              >
                {t("interviewPrep.unlockCta")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 min-[375px]:mt-6 sm:mt-8 sm:grid-cols-2 sm:gap-5">
          {cards.map(
            ({
              item,
              prep,
              roleTitle,
              company,
              matchScore,
              overall,
              extraJobs,
            }) => {
              const companyName = prettyProperName(company);
              const untitled =
                item.resume.title || t("dashboard.untitledResume");
              const heading =
                companyName && roleTitle
                  ? t("jobMatch.roleAtCompany", {
                      role: roleTitle,
                      company: companyName,
                    })
                  : companyName || roleTitle || untitled;
              const strong = overall >= 70;
              const resumeId = item.resume.id as string;
              const selected = selectedIds.includes(resumeId);
              return (
                <li key={resumeId} className="min-w-0">
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
                          onClick: () => toggleSelect(resumeId),
                          onKeyDown: (event: KeyboardEvent) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleSelect(resumeId);
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
                        resume={item.resume}
                        className="rounded-none border-0 shadow-none"
                      />
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-text sm:text-[15px]">
                        {heading}
                      </p>
                      <p className="mt-1 truncate text-xs text-text-secondary">
                        {untitled}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-text-secondary sm:text-xs">
                        {prep.total > 0
                          ? t("savedJobsPage.cardStats", {
                              match: matchScore,
                              done: prep.practiced,
                              total: prep.total,
                            })
                          : t("savedJobsPage.matchScore", {
                              score: matchScore,
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
                            onClick={() => openPrep(item.resume, prep.jobId)}
                          >
                            <span className="truncate">
                              {t("savedJobsPage.interviewPrep")}
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
                      {!selecting && extraJobs > 0 ? (
                        <button
                          type="button"
                          onClick={() => navigate("/saved-jobs")}
                          className="mt-2 truncate text-left text-[11px] font-semibold text-text-secondary transition-colors hover:text-brand"
                        >
                          {t("interviewPrep.moreJobs", { count: extraJobs })}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            },
          )}
        </ul>
      )}
    </div>
  );
}
