import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { DotRating } from "../../components/ui/DotRating";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import ResumePreviewOverlay from "../../components/resume/ResumePreviewOverlay";
import DashboardSteps from "../../components/dashboard/DashboardSteps";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { getResumesByUser, saveResumeToDashboard } from "../../lib/api";
import {
  computeJobMatch,
  prettyKeyword,
  type JobMatchResult,
} from "../../lib/jobMatch";
import { cn } from "../../lib/utils";
import type { Resume } from "../../types/resume";

const MIN_CHARS = 40;
const GAUGE_RADIUS = 42;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const ANALYZE_PHASE_MS = 1100;

const ANALYZE_PHASE_KEYS = [
  "jobMatch.analyzePhases.extract",
  "jobMatch.analyzePhases.detect",
  "jobMatch.analyzePhases.score",
] as const;

export default function JobMatch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedResume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const addSkill = useResumeStore((s) => s.addSkill);
  const updateSkill = useResumeStore((s) => s.updateSkill);
  const removeSkill = useResumeStore((s) => s.removeSkill);
  const markSaved = useResumeStore((s) => s.markSaved);

  const [jobText, setJobText] = useState("");
  const [loadingResume, setLoadingResume] = useState(!selectedResume?.id);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  /** Missing keywords from the first analysis — kept stable so Add/Level UI stays visible after apply. */
  const [keywordCandidates, setKeywordCandidates] = useState<string[]>([]);
  /** token → skill added/linked from this analysis */
  const [appliedSkills, setAppliedSkills] = useState<
    Record<string, { skillId: string; created: boolean }>
  >({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (selectedResume?.id) {
      setLoadingResume(false);
      return;
    }

    let cancelled = false;
    setLoadingResume(true);
    getResumesByUser(user.id)
      .then((data) => {
        if (cancelled) return;
        if (data[0]?.resume) setResume(data[0].resume);
        else navigate("/select-resume");
      })
      .catch(() => {
        if (!cancelled) navigate("/dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoadingResume(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, selectedResume?.id, setResume, navigate]);

  useEffect(() => {
    if (!analyzing) return;
    setAnalyzePhase(0);
    const timers = ANALYZE_PHASE_KEYS.map((_, i) =>
      window.setTimeout(() => setAnalyzePhase(i), i * ANALYZE_PHASE_MS),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [analyzing]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const charCount = jobText.trim().length;
  const canAnalyze = charCount >= MIN_CHARS && !analyzing;
  const subStep = analyzing || hasResults ? 1 : 0;

  /** Live score against the current resume — rises as keywords are added to skills. */
  const result = useMemo(() => {
    if (!hasResults || !selectedResume || !jobText.trim()) return null;
    return computeJobMatch(jobText, selectedResume);
  }, [hasResults, selectedResume, jobText]);

  const matchScore = result?.score ?? 0;

  const resumeLabel = useMemo(() => {
    if (!selectedResume) return "";
    return (
      selectedResume.title ||
      selectedResume.personal.fullName ||
      t("dashboard.untitledResume")
    );
  }, [selectedResume, t]);

  const persistResume = () => {
    if (!user) return;
    if (persistTimerRef.current != null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(async () => {
      const resume = useResumeStore.getState().resume;
      try {
        const id = await saveResumeToDashboard(resume, user.id);
        markSaved(id);
      } catch {
        // Keep dirty so the user can still save from the builder later.
      }
    }, 350);
  };

  const applyKeyword = (token: string) => {
    applyKeywords([token]);
  };

  const applyKeywords = (tokens: string[]) => {
    const next = tokens.filter((token) => !(token in appliedSkills));
    if (next.length === 0) return;

    const added: Record<string, { skillId: string; created: boolean }> = {};
    for (const token of next) {
      const pretty = prettyKeyword(token);
      const existing = useResumeStore
        .getState()
        .resume.skills.find(
          (s) => s.name.trim().toLowerCase() === pretty.toLowerCase(),
        );
      if (existing) {
        added[token] = { skillId: existing.id, created: false };
        continue;
      }
      addSkill(pretty);
      const skill = useResumeStore
        .getState()
        .resume.skills.find(
          (s) => s.name.trim().toLowerCase() === pretty.toLowerCase(),
        );
      if (skill) added[token] = { skillId: skill.id, created: true };
    }
    setAppliedSkills((prev) => ({ ...prev, ...added }));
    persistResume();
  };

  const handleRemoveKeyword = (token: string) => {
    const entry = appliedSkills[token];
    if (!entry) return;
    if (entry.created) removeSkill(entry.skillId);
    setAppliedSkills((prev) => {
      const next = { ...prev };
      delete next[token];
      return next;
    });
    persistResume();
  };

  const handleSkillLevel = (token: string, level: number) => {
    const entry = appliedSkills[token];
    if (!entry) return;
    updateSkill(entry.skillId, { level });
    persistResume();
  };

  const handleBackToJob = () => {
    setHasResults(false);
    setKeywordCandidates([]);
    setPreviewOpen(false);
  };

  const handleGetSuggestions = () => {
    if (!result) return;
    const remaining = keywordCandidates.filter(
      (token) => !(token in appliedSkills),
    );
    if (remaining.length > 0) {
      applyKeywords(remaining);
      return;
    }
    navigate("/interview-prep");
  };

  const handleAnalyze = async () => {
    if (!selectedResume || !canAnalyze) return;
    setError(null);
    setHasResults(false);
    setKeywordCandidates([]);
    setAppliedSkills({});
    setAnalyzing(true);

    const totalMs = ANALYZE_PHASE_KEYS.length * ANALYZE_PHASE_MS;
    await new Promise((r) => setTimeout(r, totalMs));

    try {
      const resume = useResumeStore.getState().resume;
      const match = computeJobMatch(jobText, resume);
      setKeywordCandidates(match.missing);
      setHasResults(true);
    } catch {
      setError(t("jobMatch.analyzeError"));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loadingResume || !selectedResume) {
    return (
      <div className="flex items-center justify-center px-4 py-24 text-text-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="ml-3 text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-clip px-3 py-5 min-[375px]:px-4 sm:px-6 sm:py-10">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="break-words text-xl font-bold leading-tight min-[375px]:text-2xl sm:text-3xl">
          <span className="text-text">
            {t("dashboard.welcomeTitle", { name: "" })}
          </span>{" "}
          <span className="break-words italic text-brand">{fullName}</span>
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="mt-5 sm:mt-8">
        <DashboardSteps activeIndex={1} />
      </div>

      <div className="mt-6 grid min-w-0 gap-4 sm:mt-8 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <section
          className={cn(
            "order-2 min-w-0 rounded-[20px] border bg-bg p-4 shadow-sm min-[375px]:rounded-[24px] min-[375px]:p-5 sm:rounded-[32px] sm:p-6 lg:p-8",
            result && !analyzing ? "border-brand/40" : "border-brand/15",
          )}
        >
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <AnalyzingPanel activePhase={analyzePhase} />
              </motion.div>
            ) : result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <ResultsPanel
                  resume={selectedResume}
                  resumeLabel={resumeLabel}
                  result={result}
                  keywordCandidates={keywordCandidates}
                  appliedSkills={appliedSkills}
                  onApply={applyKeyword}
                  onRemove={handleRemoveKeyword}
                  onLevelChange={handleSkillLevel}
                  onOpenPreview={() => setPreviewOpen(true)}
                  onBack={handleBackToJob}
                  onGetSuggestions={handleGetSuggestions}
                />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <span className="inline-flex max-w-full rounded-full bg-brand/10 px-3.5 py-1.5 text-[11px] font-semibold text-brand min-[375px]:px-4 min-[375px]:text-xs">
                  {t("jobMatch.stepBadge")}
                </span>

                <h2 className="mt-4 break-words text-xl font-extrabold tracking-tight leading-tight text-text min-[375px]:text-2xl sm:text-3xl">
                  {t("jobMatch.title")}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                  {t("jobMatch.description")}
                </p>

                <div className="mt-5 grid min-w-0 gap-5 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_148px] lg:items-start">
                  <div className="relative min-w-0">
                    <textarea
                      value={jobText}
                      onChange={(e) => {
                        setJobText(e.target.value);
                        setError(null);
                        if (hasResults) {
                          setHasResults(false);
                          setKeywordCandidates([]);
                          setAppliedSkills({});
                        }
                      }}
                      rows={10}
                      placeholder={t("jobMatch.placeholder")}
                      className={cn(
                        "w-full min-h-[220px] resize-y rounded-2xl border bg-surface-2/60 p-3.5 pb-9",
                        "sm:min-h-[300px] sm:p-4 sm:pb-10",
                        "text-sm leading-relaxed text-text",
                        "placeholder:text-text-placeholder",
                        "focus:outline-none focus:ring-2 focus:ring-ring/50",
                        "transition-colors",
                        error
                          ? "border-destructive focus:border-destructive"
                          : "border-line focus:border-ring",
                      )}
                    />
                    <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2 text-[11px] text-text-secondary sm:inset-x-4">
                      <span>
                        {t("jobMatch.charCount", { count: charCount })}
                        {charCount > 0 && charCount < MIN_CHARS && (
                          <span className="ml-1.5 text-text-placeholder">
                            {t("jobMatch.minChars", { count: MIN_CHARS })}
                          </span>
                        )}
                      </span>
                    </div>
                    {error && (
                      <p className="mt-2 text-xs text-destructive">{error}</p>
                    )}
                  </div>

                  <div className="hidden min-w-0 lg:block">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                      {t("jobMatch.comparingAgainst")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="group w-full overflow-hidden rounded-xl border border-line bg-surface-2 p-2 text-left shadow-sm transition-colors hover:border-brand/40 cursor-zoom-in"
                    >
                      <ScaledResumePreview resume={selectedResume} />
                      <p className="mt-2 truncate px-0.5 text-center text-[11px] font-medium text-text">
                        {resumeLabel}
                      </p>
                      <p className="mt-0.5 text-center text-[10px] text-text-secondary group-hover:text-brand">
                        {t("jobMatch.results.viewPreview")}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="mt-4 lg:hidden">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                    {t("jobMatch.comparingAgainst")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-brand/40 cursor-zoom-in"
                  >
                    <div className="w-14 shrink-0 overflow-hidden rounded-lg shadow-sm min-[375px]:w-[4.25rem]">
                      <ScaledResumePreview resume={selectedResume} />
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
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <Button
                    variant="outline"
                    size="compact"
                    className="h-11 w-full whitespace-normal rounded-full sm:h-auto sm:w-auto"
                    onClick={() => navigate("/dashboard")}
                  >
                    <ArrowLeft size={16} className="shrink-0" />
                    {t("jobMatch.back")}
                  </Button>

                  <Button
                    size="compact"
                    className="h-11 w-full whitespace-normal rounded-full sm:h-auto sm:w-auto"
                    disabled={!canAnalyze}
                    onClick={handleAnalyze}
                  >
                    {t("jobMatch.analyze")}
                    <ArrowRight size={16} className="shrink-0" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="order-1 min-w-0 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-line bg-bg p-3 sm:rounded-[20px] sm:p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                {t("jobMatch.progressLabel")}
              </p>
              <SubStepRow
                index={1}
                label={t("jobMatch.subSteps.paste")}
                active={subStep === 0}
                done={subStep > 0}
                nowLabel={t("jobMatch.now")}
                doneLabel={t("jobMatch.done")}
                connected
              />
              <SubStepRow
                index={2}
                label={t("jobMatch.subSteps.analysis")}
                active={subStep === 1}
                done={false}
                nowLabel={t("jobMatch.now")}
                doneLabel={t("jobMatch.done")}
                showBar={subStep === 1}
                barAnimated={analyzing}
              />
            </div>

            <div
              className={cn(
                "flex flex-col rounded-2xl border border-line bg-bg p-4 sm:rounded-[20px] sm:p-5",
                result && !analyzing ? "items-stretch text-left" : "items-center text-center",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                {t("jobMatch.matchLabel")}
              </p>
              {result && !analyzing ? (
                <>
                  <p className="mt-3 text-4xl font-extrabold tabular-nums tracking-tight text-text sm:text-5xl">
                    {matchScore}%
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${matchScore}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 16 }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative mt-3 size-[84px] sm:size-[96px]">
                    <svg
                      viewBox="0 0 96 96"
                      className="size-full -rotate-90"
                      aria-hidden
                    >
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
                        animate={{
                          strokeDashoffset: GAUGE_CIRCUMFERENCE,
                        }}
                        className="text-line"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums sm:text-2xl">
                      {analyzing ? (
                        <Loader2 size={22} className="animate-spin text-brand" />
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <p className="mt-3 max-w-[16rem] text-xs leading-5 text-text-secondary">
                    {analyzing
                      ? t("jobMatch.analyzingTitle")
                      : t("jobMatch.matchHint")}
                  </p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ResumePreviewOverlay
        resume={selectedResume}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeLabel={t("jobMatch.results.closePreview")}
      />
    </div>
  );
}

function matchHintKey(score: number) {
  if (score >= 80) return "jobMatch.results.matchHintHigh";
  if (score >= 40) return "jobMatch.results.matchHintMid";
  return "jobMatch.results.matchHintLow";
}

function ResultsPanel({
  resume,
  resumeLabel,
  result,
  keywordCandidates,
  appliedSkills,
  onApply,
  onRemove,
  onLevelChange,
  onOpenPreview,
  onBack,
  onGetSuggestions,
}: {
  resume: Resume;
  resumeLabel: string;
  result: JobMatchResult;
  keywordCandidates: string[];
  appliedSkills: Record<string, { skillId: string; created: boolean }>;
  onApply: (token: string) => void;
  onRemove: (token: string) => void;
  onLevelChange: (token: string, level: number) => void;
  onOpenPreview: () => void;
  onBack: () => void;
  onGetSuggestions: () => void;
}) {
  const { t } = useTranslation();
  const matched = result.matched.slice(0, 6);
  const missingPills = result.missing.slice(0, 6);
  const suggestions = keywordCandidates.slice(0, 4);
  const skillsById = Object.fromEntries(resume.skills.map((s) => [s.id, s]));

  return (
    <div>
      <span className="inline-flex max-w-full rounded-full bg-brand/10 px-3.5 py-1.5 text-[11px] font-semibold text-brand min-[375px]:px-4 min-[375px]:text-xs">
        {t("jobMatch.results.stepBadge")}
      </span>

      <h2 className="mt-4 break-words text-xl font-extrabold tracking-tight leading-tight text-text min-[375px]:text-2xl sm:text-3xl">
        {t("jobMatch.results.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
        {t("jobMatch.results.description", { name: resumeLabel })}
      </p>

      <div className="mt-5 grid min-w-0 gap-3 sm:mt-6 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface-2/40 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {t("jobMatch.results.currentMatch")}
          </p>
          <MatchDonut score={result.score} />
          <p className="mt-2 max-w-[14rem] text-xs leading-5 text-text-secondary">
            {t(matchHintKey(result.score))}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-2/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {t("jobMatch.results.skillsMatch", { count: result.matched.length })}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {matched.length === 0 ? (
              <span className="text-xs text-text-secondary">—</span>
            ) : (
              matched.map((item) => (
                <span
                  key={item}
                  className="max-w-full break-all rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-medium text-success"
                >
                  {prettyKeyword(item)}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-2/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {t("jobMatch.results.missingWeak", { count: result.missing.length })}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {missingPills.length === 0 ? (
              <span className="text-xs text-text-secondary">—</span>
            ) : (
              missingPills.map((item) => (
                <span
                  key={item}
                  className="max-w-full break-all rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                >
                  {prettyKeyword(item)}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(160px,220px)] lg:items-start">
        <div className="min-w-0 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-text">
              {t("jobMatch.results.addKeywords")}
            </h3>
            <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">
              {t("jobMatch.results.addKeywordsHint")}
            </p>
            {keywordCandidates.length === 0 ? (
              <p className="mt-2 text-sm text-text-secondary">—</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {keywordCandidates.map((token) => {
                  const entry = appliedSkills[token];
                  const applied = Boolean(entry);
                  const skill = entry ? skillsById[entry.skillId] : undefined;
                  return (
                    <li
                      key={token}
                      className="rounded-2xl border border-line bg-bg px-3.5 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full",
                            applied
                              ? "bg-success text-white"
                              : "bg-brand/10 text-brand",
                          )}
                        >
                          {applied ? (
                            <Check size={13} strokeWidth={2.6} />
                          ) : (
                            <Plus size={13} strokeWidth={2.6} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                          {prettyKeyword(token)}
                        </span>
                        {applied ? (
                          <button
                            type="button"
                            onClick={() => onRemove(token)}
                            className="shrink-0 text-xs font-medium text-text-secondary transition-colors hover:text-destructive"
                          >
                            {t("jobMatch.results.remove")}
                          </button>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            className="h-8 shrink-0 rounded-full border-brand px-3.5 text-brand hover:bg-brand/5"
                            onClick={() => onApply(token)}
                          >
                            {t("jobMatch.results.add")}
                          </Button>
                        )}
                      </div>
                      {applied && skill && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line/70 pt-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text">
                            {t("jobMatch.results.level")}
                          </span>
                          <DotRating
                            value={skill.level || 3}
                            onChange={(level) => onLevelChange(token, level)}
                            label={t("jobMatch.results.level")}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-text">
                {t("jobMatch.results.rewriteTitle")}
              </h3>
              <div className="mt-3 space-y-2.5">
                {suggestions.map((token) => {
                  const applied = token in appliedSkills;
                  const label = prettyKeyword(token);
                  return (
                    <button
                      key={token}
                      type="button"
                      disabled={applied}
                      onClick={() => onApply(token)}
                      className={cn(
                        "w-full rounded-2xl border border-line bg-surface-2/30 p-3.5 text-left transition-colors",
                        !applied &&
                          "hover:border-brand/30 hover:bg-brand/[0.03]",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                            applied
                              ? "bg-success text-white"
                              : "border border-line text-text-placeholder",
                          )}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-text">
                              {t("jobMatch.results.suggestionTitle", {
                                keyword: label,
                              })}
                            </p>
                            {applied && (
                              <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                                {t("jobMatch.results.applied")}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-text-secondary">
                            {t("jobMatch.results.suggestionBody", {
                              keyword: label,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="hidden min-w-0 lg:block">
          <button
            type="button"
            onClick={onOpenPreview}
            className="group w-full overflow-hidden rounded-xl border border-line bg-surface-2 p-2 text-left shadow-sm transition-colors hover:border-brand/40 cursor-zoom-in"
          >
            <ScaledResumePreview resume={resume} />
            <p className="mt-2 truncate px-0.5 text-center text-[11px] font-medium text-text">
              {resumeLabel}
            </p>
            <p className="mt-0.5 text-center text-[10px] text-text-secondary group-hover:text-brand">
              {t("jobMatch.results.viewPreview")}
            </p>
          </button>
        </div>
      </div>

      <div className="mt-4 lg:hidden">
        <button
          type="button"
          onClick={onOpenPreview}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-brand/40 cursor-zoom-in"
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
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Button
          variant="ghost"
          size="compact"
          className="h-11 w-full whitespace-normal rounded-full text-text-secondary sm:h-auto sm:w-auto"
          onClick={onBack}
        >
          <ArrowLeft size={16} className="shrink-0" />
          {t("jobMatch.results.backToJob")}
        </Button>

        <Button
          size="compact"
          className="h-11 w-full whitespace-normal rounded-full sm:h-auto sm:w-auto"
          onClick={onGetSuggestions}
        >
          {t("jobMatch.results.getSuggestions")}
          <ArrowRight size={16} className="shrink-0" />
        </Button>
      </div>
    </div>
  );
}

function MatchDonut({ score }: { score: number }) {
  const { t } = useTranslation();
  const offset = GAUGE_CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="relative mt-3 size-[108px] sm:size-[120px]">
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
          className="text-brand"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold tabular-nums leading-none text-brand sm:text-2xl">
          {score}%
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand/80">
          {t("jobMatch.results.matchWord")}
        </span>
      </div>
    </div>
  );
}

function AnalyzingPanel({ activePhase }: { activePhase: number }) {
  const { t } = useTranslation();
  const progress = Math.min(
    98,
    Math.round(((activePhase + 1) / ANALYZE_PHASE_KEYS.length) * 100),
  );

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-1 py-8 text-center sm:min-h-[440px] sm:py-12">
      <AnalysisVisual activePhase={activePhase} />

      <motion.div
        className="mt-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative size-5 shrink-0">
            <span className="absolute inset-0 rounded-full border-2 border-brand/15" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand border-r-brand/40" />
          </span>
          <h2 className="text-base font-bold tracking-tight text-text sm:text-lg">
            {t("jobMatch.analyzingTitle")}
          </h2>
        </div>
        <p className="text-xs font-medium tabular-nums text-brand sm:text-sm">
          {progress}%
        </p>
      </motion.div>

      <ol className="mt-7 w-full max-w-md space-y-2 text-left">
        {ANALYZE_PHASE_KEYS.map((key, i) => {
          const done = i < activePhase;
          const current = i === activePhase;
          return (
            <motion.li
              key={key}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.35 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-300",
                current
                  ? "border-brand/25 bg-brand/5 shadow-sm"
                  : done
                    ? "border-line/80 bg-surface-2/40"
                    : "border-transparent bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  done
                    ? "bg-success text-white"
                    : current
                      ? "bg-brand text-white"
                      : "border border-line text-text-placeholder",
                )}
              >
                {done ? (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                ) : current ? (
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm leading-snug",
                  current
                    ? "font-semibold text-text"
                    : done
                      ? "font-medium text-text-secondary"
                      : "text-text-placeholder",
                )}
              >
                {t(key)}
              </span>
              {current && (
                <motion.span
                  className="hidden text-[10px] font-bold uppercase tracking-wider text-brand sm:inline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {t("jobMatch.now")}
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ol>

      <div className="relative mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-surface-2 sm:w-64">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          initial={{ width: "6%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/20"
          animate={{ left: ["-20%", "110%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}

function AnalysisVisual({ activePhase }: { activePhase: number }) {
  return (
    <div className="relative flex h-36 w-full max-w-xs items-center justify-center sm:h-40 sm:max-w-sm">
      {/* soft atmosphere */}
      <motion.div
        aria-hidden
        className="absolute size-40 rounded-full bg-brand/[0.07] blur-3xl sm:size-48"
        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* orbit ring */}
      <motion.div
        aria-hidden
        className="absolute size-[9.5rem] rounded-full border border-dashed border-brand/25 sm:size-[11rem]"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-brand" />
        <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brand/50" />
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute size-[7.25rem] rounded-full border border-brand/10 sm:size-[8.5rem]"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* dual documents */}
      <div className="relative z-10 flex items-end gap-3 sm:gap-4">
        <DocCard
          tone="job"
          tilt={-8}
          delay={0}
          highlight={activePhase === 0}
        />
        <div className="relative mb-8 flex w-8 items-center justify-center sm:mb-10 sm:w-10">
          <motion.div
            className="h-px w-full bg-gradient-to-r from-brand/20 via-brand to-brand/20"
            animate={{ opacity: [0.35, 1, 0.35], scaleX: [0.7, 1, 0.7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute size-2 rounded-full bg-brand"
            animate={{ x: [-14, 14, -14] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <DocCard
          tone="resume"
          tilt={8}
          delay={0.08}
          highlight={activePhase >= 2}
        />
      </div>
    </div>
  );
}

function DocCard({
  tone,
  tilt,
  delay,
  highlight,
}: {
  tone: "job" | "resume";
  tilt: number;
  delay: number;
  highlight: boolean;
}) {
  const lines =
    tone === "job"
      ? ["w-[72%]", "w-[90%]", "w-[58%]", "w-[82%]", "w-[48%]"]
      : ["w-[80%]", "w-[66%]", "w-[88%]", "w-[54%]", "w-[76%]"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: tilt }}
      animate={{
        opacity: 1,
        y: [0, -4, 0],
        rotate: tilt,
        scale: highlight ? 1.04 : 1,
      }}
      transition={{
        opacity: { duration: 0.4, delay },
        y: { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay },
        scale: { duration: 0.35 },
      }}
      className={cn(
        "relative w-[5.25rem] overflow-hidden rounded-xl border p-3 shadow-sm sm:w-24",
        tone === "job"
          ? "border-brand/20 bg-brand-light"
          : "border-line bg-bg",
        highlight && "ring-2 ring-brand/30",
      )}
    >
      <div
        className={cn(
          "mb-2.5 h-1.5 rounded-full",
          tone === "job" ? "w-8 bg-brand/30" : "w-7 bg-text-placeholder/40",
        )}
      />
      <div className="space-y-1.5">
        {lines.map((width, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-1.5 rounded-full",
              width,
              tone === "job" ? "bg-brand/20" : "bg-line",
            )}
            animate={{ opacity: highlight ? [0.45, 1, 0.45] : 0.7 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-brand/25 via-brand/10 to-transparent"
        animate={{ top: ["-30%", "110%"] }}
        transition={{
          duration: 2.1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: tone === "resume" ? 0.35 : 0,
        }}
      />
    </motion.div>
  );
}

function SubStepRow({
  index,
  label,
  active,
  done,
  nowLabel,
  doneLabel,
  connected = false,
  showBar = false,
  barAnimated = false,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
  nowLabel: string;
  doneLabel: string;
  connected?: boolean;
  showBar?: boolean;
  barAnimated?: boolean;
}) {
  return (
    <div className={cn("flex gap-2.5 min-[375px]:gap-3", connected && "mb-1")}>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
            done
              ? "bg-success text-white"
              : active
                ? "bg-brand text-white"
                : "border border-line text-text-secondary",
          )}
        >
          {index}
        </span>
        {connected && (
          <span
            className={cn(
              "mt-1 w-0.5 flex-1 min-h-4 rounded-full",
              done ? "bg-success/60" : "bg-line",
            )}
          />
        )}
      </div>
      <div className="mb-1 min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-2.5 py-2",
            active && "bg-brand/10",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 text-xs font-medium leading-snug min-[375px]:text-sm",
              done ? "text-text" : active ? "text-brand" : "text-text-secondary",
            )}
          >
            {label}
          </span>
          {done && (
            <span className="hidden shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success min-[400px]:inline">
              {doneLabel}
            </span>
          )}
          {active && (
            <span className="hidden shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white min-[400px]:inline">
              {nowLabel}
            </span>
          )}
        </div>
        {showBar && (
          <div className="mx-2.5 mt-1 h-0.5 overflow-hidden rounded-full bg-brand/15">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: "18%" }}
              animate={
                barAnimated
                  ? { width: ["22%", "78%", "48%"] }
                  : { width: "72%" }
              }
              transition={
                barAnimated
                  ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 70, damping: 18 }
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

