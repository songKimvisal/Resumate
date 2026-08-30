import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useTransform,
  type Variants,
} from "motion/react";

import { Button } from "../../components/ui/button";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import ResumePreviewOverlay from "../../components/resume/ResumePreviewOverlay";
import DashboardSteps from "../../components/dashboard/DashboardSteps";
import PageTitle from "../../components/layout/PageTitle";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { useJourneyStore, journeyContinuePath } from "../../store/journeyStore";
import { getResumesByUser, type DashboardResume } from "../../lib/api";
import { computeCompleteness } from "../../lib/resumeCompleteness";
import type { ScoreBand } from "../../lib/resumeCompleteness";
import { cn } from "../../lib/utils";
import logo from "../../assets/logo/resume2.png";

const BAND_RING_CLASS: Record<ScoreBand, string> = {
  excellent: "text-success",
  strong: "text-success",
  good: "text-amber-500",
  needsWork: "text-brand",
};

function ScoreRing({
  score,
  band,
  size,
  showLabel,
  idle = false,
}: {
  score: number;
  band: ScoreBand;
  size: "sm" | "lg";
  showLabel?: boolean;
  idle?: boolean;
}) {
  const { t } = useTranslation();
  const large = size === "lg";
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const empty = idle || score === 0;

  return (
    <div
      className={cn(
        "relative shrink-0",
        large ? "size-24" : "size-12",
      )}
    >
      <svg
        viewBox="0 0 96 96"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={large ? 8 : 10}
          className="text-line"
        />
        {!empty && (
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={large ? 8 : 10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference * (1 - score / 100),
            }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 14,
            }}
            className={BAND_RING_CLASS[band]}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {idle ? (
          <span
            className={cn(
              "font-bold leading-none text-text-secondary",
              large ? "text-xl" : "text-[11px]",
            )}
          >
            —
          </span>
        ) : (
          <AnimatedPercent
            score={score}
            className={cn(
              "font-bold leading-none tabular-nums whitespace-nowrap text-text",
              large ? "text-xl" : "text-[11px]",
            )}
          />
        )}
        {showLabel && (
          <span className="mt-0.5 text-[11px] font-medium text-text-secondary">
            {t("dashboard.scoreLabel")}
          </span>
        )}
      </div>
    </div>
  );
}

function AnimatedPercent({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const value = useMotionValue(0);
  const label = useTransform(value, (latest) => `${Math.round(latest)}%`);

  useEffect(() => {
    const controls = animate(value, score, {
      type: "spring",
      stiffness: 60,
      damping: 14,
    });
    return () => controls.stop();
  }, [score, value]);

  return <motion.span className={className}>{label}</motion.span>;
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { user } = useAuth();
  const setResume = useResumeStore((s) => s.setResume);
  const selectedResume = useResumeStore((s) => s.resume);

  const lastResumeId = useJourneyStore((s) =>
    s.lastUserId === user?.id ? s.lastResumeId : null,
  );
  const rememberResume = useJourneyStore((s) => s.rememberResume);

  const [resumes, setResumes] = useState<DashboardResume[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadResumes = useCallback(async () => {
    if (!user) return;

    setResumes(null);
    setLoadError(false);

    try {
      const data = await getResumesByUser(user.id);

      setResumes(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const timer = window.setTimeout(() => {
      void loadResumes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user, loadResumes]);

  const isLoading = resumes === null && !loadError;
  const currentResume =
    (selectedResume &&
      resumes?.some((r) => r.resume.id === selectedResume.id) &&
      selectedResume) ||
    (lastResumeId &&
      resumes?.find((r) => r.resume.id === lastResumeId)?.resume) ||
    resumes?.[0]?.resume ||
    null;

  useEffect(() => {
    if (user && currentResume?.id) rememberResume(user.id, currentResume.id);
  }, [user, currentResume?.id, rememberResume]);

  const completion = useMemo(
    () => (currentResume ? computeCompleteness(currentResume) : null),
    [currentResume],
  );

  const score = completion?.score ?? 0;
  const band = completion?.band ?? "needsWork";
  const missingCount = completion?.missing.length ?? 0;
  const isComplete = !!currentResume && missingCount === 0;

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const headline = useMemo(() => {
    if (!currentResume) {
      return t("dashboard.noResumeTitle");
    }

    if (isComplete || score >= 90) {
      return t("dashboard.currentResumeHeadingExcellent");
    }

    if (score >= 80) {
      return t("dashboard.currentResumeHeadingTopTen");
    }

    if (score >= 60) {
      return t("dashboard.currentResumeHeadingStrong");
    }

    return t("dashboard.currentResumeHeadingNeedsWork");
  }, [currentResume, isComplete, score, t]);

  const bodyText = useMemo(() => {
    if (!currentResume) {
      return t("dashboard.noResumeBody");
    }

    if (isComplete) {
      return t("dashboard.currentResumeBodyExcellent");
    }

    if (score >= 80) {
      return t("dashboard.currentResumeBodyStrong");
    }

    if (score >= 60) {
      return t("dashboard.currentResumeBodyHealthy");
    }

    return t("dashboard.currentResumeBodyNeedsWork");
  }, [currentResume, isComplete, score, t]);

  const journeyStep = useJourneyStore((s) => {
    if (!user?.id || !currentResume?.id) return 0;
    return s.byKey[`${user.id}:${currentResume.id}`]?.step ?? 0;
  });

  const handleFixMissing = () => {
    if (!currentResume) {
      navigate("/marketplace");
      return;
    }

    setResume(currentResume);
    navigate("/builder");
  };

  const handleContinue = () => {
    if (!currentResume) {
      navigate("/marketplace");
      return;
    }

    setResume(currentResume);

    const go = () => {
      const step = useJourneyStore
        .getState()
        .getDraft(user?.id, currentResume.id).step;
      navigate(journeyContinuePath(step));
    };

    if (useJourneyStore.persist.hasHydrated()) go();
    else useJourneyStore.persist.onFinishHydration(go);
  };

  const handleChangeResume = () => {
    navigate("/select-resume");
  };

  return (
    <motion.div
      className={cn(
        "w-full max-w-6xl mx-auto",
        "px-3 min-[375px]:px-4 sm:px-6",
        "py-5 sm:py-10",
        "overflow-x-clip",
      )}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ============================================================
          HEADER
      ============================================================ */}
      <motion.div variants={fadeUpVariants} className="space-y-2 sm:space-y-3">
        <PageTitle text={`${t("nav.welcomeBack")},`} accent={fullName} />

        <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
          {t("dashboard.subtitle")}
        </p>
      </motion.div>

      {/* ============================================================
          STEP NAVIGATION
      ============================================================ */}
      <motion.div variants={fadeUpVariants} className="mt-5 min-w-0 sm:mt-8">
        <DashboardSteps activeIndex={currentResume ? journeyStep : 0} />
      </motion.div>

      {/* ============================================================
          CONTENT STATES
      ============================================================ */}
      <AnimatePresence mode="wait">
        {/* ------------------------------------------------------------
            LOADING
        ------------------------------------------------------------ */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-6 sm:mt-8",
              "flex items-center justify-center",
              "rounded-2xl sm:rounded-3xl",
              "border border-line",
              "bg-surface",
              "p-8 sm:p-10",
              "text-text-secondary",
            )}
          >
            <Loader2 size={20} className="animate-spin shrink-0" />

            <span className="ml-3 text-sm sm:text-base">
              {t("common.loading")}
            </span>
          </motion.div>
        )}

        {/* ------------------------------------------------------------
            ERROR
        ------------------------------------------------------------ */}
        {!isLoading && loadError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-6 sm:mt-8",
              "flex flex-col items-center justify-center",
              "gap-3",
              "rounded-2xl sm:rounded-3xl",
              "border border-line",
              "bg-surface",
              "p-8 sm:p-10",
              "text-center",
              "text-text-secondary",
            )}
          >
            <p className="text-sm sm:text-base">{t("dashboard.loadError")}</p>

            <Button
              variant="outline"
              onClick={loadResumes}
              className="rounded-full"
            >
              {t("dashboard.retry")}
            </Button>
          </motion.div>
        )}

        {/* ------------------------------------------------------------
            MAIN CONTENT
        ------------------------------------------------------------ */}
        {!isLoading && !loadError && (
          <motion.div
            key="content"
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          >
            {/* ========================================================
                LOGO + MAIN CARD
            ======================================================== */}
            <div
              className={cn(
                "mt-5 sm:mt-8",
                "flex flex-col items-center",
                "lg:flex-row lg:items-end",
                "gap-3 sm:gap-4 lg:gap-6",
              )}
            >
              {/* ------------------------------------------------------
                  LOGO
              ------------------------------------------------------ */}
              <motion.div
                className={cn(
                  "hidden lg:block lg:relative",
                  "lg:h-[260px] lg:w-[280px]",
                  "shrink-0 overflow-hidden",
                )}
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.15,
                  ease: "easeOut",
                }}
              >
                <img
                  src={logo}
                  alt="Resu Mate"
                  className="absolute bottom-[-90px] left-1/2 w-[500px] max-w-none -translate-x-1/2 -scale-x-100"
                />
              </motion.div>

              {/* ------------------------------------------------------
                  MAIN RESUME CARD
              ------------------------------------------------------ */}
              <div
                className={cn(
                  "w-full min-w-0 flex-1",
                  "rounded-2xl sm:rounded-[28px] lg:rounded-[32px]",
                  "border border-line",
                  "bg-bg",
                  "p-3.5 min-[375px]:p-4 sm:p-6 lg:p-8",
                  "shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "grid min-w-0",
                    "gap-4 min-[375px]:gap-5 sm:gap-8",
                    currentResume
                      ? "lg:grid-cols-[1.3fr_1fr_auto]"
                      : "lg:grid-cols-[1.3fr_1fr]",
                    "lg:items-center",
                  )}
                >
                  {/* ==================================================
                      HEADLINE + ACTIONS
                  ================================================== */}
                  <div
                    className={cn(
                      "min-w-0",
                      "space-y-3 sm:space-y-5",
                      "text-center lg:text-left",
                    )}
                  >
                    {/* Resume label */}
                    <span
                      className={cn(
                        "inline-flex",
                        "max-w-full",
                        "rounded-full",
                        "bg-brand/10",
                        "px-3 py-1",
                        "min-[375px]:px-3.5 min-[375px]:py-1.5",
                        "text-[11px] min-[375px]:text-xs",
                        "font-semibold",
                        "text-brand",
                      )}
                    >
                      {t("dashboard.currentResumeLabel")}
                    </span>

                    {/* Heading */}
                    <div className="space-y-2">
                      <h2
                        className={cn(
                          "text-lg",
                          "min-[375px]:text-xl",
                          "sm:text-3xl",
                          "font-extrabold",
                          "tracking-tight",
                          "leading-tight",
                          "text-text",
                          "break-words",
                        )}
                      >
                        {headline}
                      </h2>

                      <p
                        className={cn(
                          "mx-auto lg:mx-0",
                          "max-w-sm",
                          "text-[13px]",
                          "leading-5",
                          "sm:text-sm sm:leading-6",
                          "text-text-secondary",
                          "break-words",
                        )}
                      >
                        {bodyText}
                      </p>
                    </div>

                    {/* ==================================================
                        ACTION BUTTONS
                    ================================================== */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2.5 lg:justify-start">
                      <Button
                        className="h-9 w-full rounded-full px-3 text-[13px] sm:w-auto sm:px-4"
                        onClick={handleFixMissing}
                        size="compact"
                      >
                        {currentResume
                          ? isComplete
                            ? t("dashboard.editResume")
                            : t("dashboard.fixMissing")
                          : t("dashboard.createResume")}
                      </Button>
                      <Button
                        variant="outline"
                        size="compact"
                        className="h-9 w-full rounded-full px-3 text-[13px] sm:w-auto sm:px-4"
                        onClick={handleChangeResume}
                      >
                        {t("dashboard.changeResume")}
                      </Button>
                    </div>
                  </div>

                  {/* ==================================================
                      RESUME PREVIEW
                  ================================================== */}
                  <div className="relative mx-auto w-full max-w-[11.5rem] min-[375px]:max-w-[13rem] sm:max-w-[220px] overflow-visible">
                    {currentResume ? (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="group w-full text-left cursor-zoom-in"
                        aria-label={t("dashboard.viewPreview")}
                      >
                        <ScaledResumePreview resume={currentResume} />
                        <p className="mt-2 text-center text-[11px] font-medium text-text-secondary group-hover:text-brand">
                          {t("dashboard.viewPreview")}
                        </p>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFixMissing}
                        className="group flex aspect-[210/297] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-line bg-bg px-3 text-center transition-colors hover:border-brand/50 hover:text-brand"
                        aria-label={t("dashboard.createResume")}
                      >
                        <span className="inline-flex size-9 items-center justify-center rounded-full border-2 border-line text-text-secondary transition-colors group-hover:border-brand group-hover:text-brand">
                          <Plus size={18} strokeWidth={2} />
                        </span>
                        <p className="text-xs font-medium leading-5 text-text-secondary group-hover:text-brand">
                          {t("dashboard.emptyPreview")}
                        </p>
                      </button>
                    )}

                    {currentResume ? (
                      <div
                        className={cn(
                          "pointer-events-none absolute right-1 top-1 z-10 lg:hidden",
                          "rounded-full border border-line bg-bg p-1 shadow-md",
                        )}
                      >
                        <ScoreRing score={score} band={band} size="sm" />
                      </div>
                    ) : null}
                  </div>

                  {currentResume ? (
                    <div
                      className={cn(
                        "hidden lg:flex flex-col",
                        "items-center",
                        "justify-self-center",
                        "gap-2",
                        "min-w-[7.5rem]",
                      )}
                    >
                      <ScoreRing
                        score={score}
                        band={band}
                        size="lg"
                        showLabel
                      />

                      <div className="text-center">
                        <p className="text-sm font-semibold text-text">
                          {t("dashboard.completenessLabel")}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-text-secondary">
                          {isComplete
                            ? t("dashboard.scoreComplete")
                            : t("dashboard.scoreCaption", {
                                count: missingCount,
                              })}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ========================================================
                CONTINUE BUTTON
            ======================================================== */}
            <div className="mt-4 flex justify-end sm:mt-6">
              <Button
                size="compact"
                className="h-9 rounded-full px-6"
                onClick={handleContinue}
              >
                {t("dashboard.continue")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResumePreviewOverlay
        resume={currentResume}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        closeLabel={t("dashboard.closePreview")}
      />
    </motion.div>
  );
}
