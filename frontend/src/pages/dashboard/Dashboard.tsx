import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";

import { Button } from "../../components/ui/button";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import ResumePreviewOverlay from "../../components/resume/ResumePreviewOverlay";
import DashboardSteps from "../../components/dashboard/DashboardSteps";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { getResumesByUser, type DashboardResume } from "../../lib/api";
import { computeCompleteness } from "../../lib/resumeCompleteness";
import type { ScoreBand } from "../../lib/resumeCompleteness";
import { cn } from "../../lib/utils";
import logo from "../../assets/logo/resume2.png";

const BAND_RING_CLASS: Record<ScoreBand, string> = {
  excellent: "text-success",
  strong: "text-success",
  good: "text-amber-500",
  needsWork: "text-destructive",
};

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

  // Prefer whichever resume the user explicitly picked in /select-resume
  // (held in the shared resume store — the same field the builder handoff
  // and MyResumes' "continue" already use), but only if it's still present
  // in the freshly-fetched list. This guards against showing a stale
  // selection for a resume that's since been deleted or renamed.
  const currentResume =
    (selectedResume &&
      resumes?.some((r) => r.resume.id === selectedResume.id) &&
      selectedResume) ||
    resumes?.[0]?.resume ||
    null;

  const completion = useMemo(
    () => (currentResume ? computeCompleteness(currentResume) : null),
    [currentResume],
  );

  const score = completion?.score ?? 0;
  const band = completion?.band ?? "needsWork";

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const headline = useMemo(() => {
    if (!currentResume) {
      return t("dashboard.noResumeTitle");
    }

    if (score >= 90) {
      return t("dashboard.currentResumeHeadingExcellent");
    }

    if (score >= 80) {
      return t("dashboard.currentResumeHeadingTopTen");
    }

    if (score >= 60) {
      return t("dashboard.currentResumeHeadingStrong");
    }

    return t("dashboard.currentResumeHeadingNeedsWork");
  }, [currentResume, score, t]);

  const bodyText = useMemo(() => {
    if (!currentResume) {
      return t("dashboard.noResumeBody");
    }

    if (score >= 80) {
      return t("dashboard.currentResumeBodyStrong");
    }

    if (score >= 60) {
      return t("dashboard.currentResumeBodyHealthy");
    }

    return t("dashboard.currentResumeBodyNeedsWork");
  }, [currentResume, score, t]);

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
    navigate("/job-match");
  };

  const handleChangeResume = () => {
    navigate("/select-resume");
  };

  // Circle math kept identical to Step5Review.tsx.
  const gaugeRadius = 42;
  const circumference = 2 * Math.PI * gaugeRadius;

  return (
    <motion.div
      className={cn(
        "w-full max-w-6xl mx-auto",
        "px-3 min-[375px]:px-4 sm:px-6",
        "py-5 sm:py-10",
        "overflow-hidden",
      )}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ============================================================
          HEADER
      ============================================================ */}
      <motion.div variants={fadeUpVariants} className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl min-[375px]:text-3xl font-bold leading-tight">
          <span className="text-text">
            {t("dashboard.welcomeTitle", {
              name: "",
            })}
          </span>{" "}
          <span className="text-brand italic break-words">{fullName}</span>
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
          {t("dashboard.subtitle")}
        </p>
      </motion.div>

      {/* ============================================================
          STEP NAVIGATION
      ============================================================ */}
      <motion.div
        variants={fadeUpVariants}
        className={cn("mt-5 sm:mt-8", "sm:-mx-0")}
      >
        <DashboardSteps activeIndex={0} />
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
                  "rounded-[20px]",
                  "min-[375px]:rounded-[24px]",
                  "sm:rounded-[32px]",
                  "border border-brand/15",
                  "bg-bg",
                  "p-4",
                  "min-[375px]:p-5",
                  "sm:p-6",
                  "lg:p-8",
                  "shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "grid min-w-0",
                    "gap-7 min-[375px]:gap-8",
                    "lg:grid-cols-[1.3fr_1fr_auto]",
                    "lg:items-center",
                  )}
                >
                  {/* ==================================================
                      HEADLINE + ACTIONS
                  ================================================== */}
                  <div
                    className={cn(
                      "min-w-0",
                      "space-y-4 sm:space-y-5",
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
                        "px-3.5 py-1.5",
                        "min-[375px]:px-4",
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
                          "text-xl",
                          "min-[375px]:text-2xl",
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
                          "text-sm",
                          "leading-6",
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
                    <div
                      className={cn(
                        "flex flex-col",
                        "min-[400px]:flex-row",
                        "items-stretch min-[400px]:items-center",
                        "justify-center lg:justify-start",
                        "gap-2.5",
                        "pt-1",
                      )}
                    >
                      {/* Fix / Create Resume */}
                      <motion.div
                        whileHover={{
                          scale: 1.03,
                        }}
                        whileTap={{
                          scale: 0.97,
                        }}
                        className="w-full min-[400px]:w-auto"
                      >
                        <Button
                          className="w-full min-[400px]:w-auto rounded-full "
                          onClick={handleFixMissing}
                          size={"compact"}
                        >
                          {currentResume
                            ? t("dashboard.fixMissing")
                            : t("dashboard.createResume")}
                        </Button>
                      </motion.div>

                      {/* Change Resume */}
                      <motion.div
                        whileHover={{
                          scale: 1.03,
                        }}
                        whileTap={{
                          scale: 0.97,
                        }}
                        className="w-full min-[400px]:w-auto"
                      >
                        <Button
                          variant="outline"
                          size={"compact"}
                          className="w-full min-[400px]:w-auto rounded-full"
                          onClick={handleChangeResume}
                        >
                          {t("dashboard.changeResume")}
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* ==================================================
                      RESUME PREVIEW
                  ================================================== */}
                  <div className="relative mx-auto w-full max-w-[240px] min-[375px]:max-w-[250px] sm:max-w-[220px]">
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
                      <div
                        className={cn(
                          "w-full",
                          "aspect-[210/297]",
                          "rounded-md",
                          "border border-dashed border-line",
                          "bg-surface",
                          "flex items-center justify-center",
                          "text-center",
                          "px-4",
                        )}
                      >
                        <p className="text-xs leading-5 text-text-secondary">
                          {t("dashboard.noResumeBody")}
                        </p>
                      </div>
                    )}

                    {/* Keep the score with the preview on small screens. */}
                    <div
                      className={cn(
                        "absolute -right-3 -top-3 z-10 lg:hidden",
                        "rounded-full border border-line bg-bg p-1.5 shadow-md",
                      )}
                    >
                      <div className="relative size-14">
                        <svg viewBox="0 0 96 96" className="size-14 -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r={gaugeRadius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-line"
                          />
                          <motion.circle
                            cx="48"
                            cy="48"
                            r={gaugeRadius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{
                              strokeDashoffset:
                                circumference * (1 - score / 100),
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 60,
                              damping: 14,
                            }}
                            className={BAND_RING_CLASS[band]}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                          {score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      COMPLETENESS GAUGE
                  ================================================== */}
                  <div
                    className={cn(
                      "hidden lg:flex flex-col",
                      "items-center",
                      "justify-self-center",
                      "gap-2",
                    )}
                  >
                    <div
                      className={cn(
                        "relative",
                        "size-[76px]",
                        "min-[375px]:size-20",
                        "sm:size-24",
                      )}
                    >
                      <svg
                        viewBox="0 0 96 96"
                        className={cn(
                          "size-[76px]",
                          "min-[375px]:size-20",
                          "sm:size-24",
                          "-rotate-90",
                        )}
                      >
                        {/* Background ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r={gaugeRadius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-line"
                        />

                        {/* Progress ring */}
                        <motion.circle
                          cx="48"
                          cy="48"
                          r={gaugeRadius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          initial={{
                            strokeDashoffset: circumference,
                          }}
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
                      </svg>

                      {/* Gauge text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className={cn(
                            "text-lg",
                            "min-[375px]:text-xl",
                            "sm:text-2xl",
                            "font-bold",
                          )}
                        >
                          {score}%
                        </span>

                        <span
                          className={cn(
                            "text-[9px]",
                            "min-[375px]:text-[10px]",
                            "sm:text-[11px]",
                            "text-text-secondary",
                          )}
                        >
                          {t("dashboard.scoreLabel")}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-text text-center">
                      {t("dashboard.completenessLabel", "Completeness")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                CONTINUE BUTTON
            ======================================================== */}
            <div
              className={cn(
                "mt-5 sm:mt-6",
                "flex justify-center lg:justify-end",
              )}
            >
              <motion.div
                whileHover={{
                  scale: 1.03,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="w-full sm:w-auto"
              >
                <Button
                  size="compact"
                  className="w-full sm:w-auto rounded-full"
                  onClick={handleContinue}
                >
                  {t("dashboard.continue")}
                </Button>
              </motion.div>
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
