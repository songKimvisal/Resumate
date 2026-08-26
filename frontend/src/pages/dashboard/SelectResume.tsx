import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileText, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Button } from "../../components/ui/button";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { getResumesByUser, type DashboardResume } from "../../lib/api";
import { useJourneyStore } from "../../store/journeyStore";
import { cn } from "../../lib/utils";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function SelectResume() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const setResume = useResumeStore((s) => s.setResume);
  const resetResume = useResumeStore((s) => s.resetResume);
  const rememberResume = useJourneyStore((s) => s.rememberResume);

  const [resumes, setResumes] = useState<DashboardResume[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
  });

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

  const retryLoad = () => {
    if (!user) return;
    setResumes(null);
    setLoadError(false);
    fetchResumes(user.id);
  };

  const handleBack = () => navigate("/dashboard");

  const handleNewResume = () => {
    resetResume();
    navigate("/marketplace");
  };

  const handleSelect = (item: DashboardResume) => {
    setResume(item.resume);
    if (user && item.resume.id) rememberResume(user.id, item.resume.id);
    navigate("/dashboard");
  };

  const isLoading = resumes === null && !loadError;

  return (
    <motion.div
      className="mx-auto max-w-6xl px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] min-[375px]:px-4 sm:px-6 sm:py-7"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUpVariants} className="space-y-3 sm:space-y-4">
        <Button
          size="compact"
          className="h-9 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          {t("selectResume.back")}
        </Button>
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl font-bold text-text min-[375px]:text-2xl sm:text-3xl">
            {t("selectResume.title")}
          </h1>
          <p className="max-w-xl text-sm text-text-secondary sm:text-base">
            {t("selectResume.subtitle")}
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex items-center justify-center rounded-2xl border border-line bg-surface p-10 text-text-secondary"
          >
            <Loader2 size={20} className="animate-spin" />
            <span className="ml-3">{t("common.loading")}</span>
          </motion.div>
        )}

        {!isLoading && loadError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-10 text-center text-text-secondary"
          >
            <p>{t("selectResume.loadError")}</p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={retryLoad}
            >
              {t("selectResume.retry")}
            </Button>
          </motion.div>
        )}

        {!isLoading && !loadError && (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5"
          >
            <motion.button
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewResume}
              className="flex aspect-[210/297] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line text-text-secondary transition-colors hover:border-brand/50 hover:text-brand sm:gap-3"
            >
              <span className="px-1.5 text-center text-xs font-semibold text-text sm:px-2 sm:text-base">
                {t("selectResume.newResume")}
              </span>
              <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-current sm:size-9">
                <Plus size={16} strokeWidth={2} />
              </span>
            </motion.button>

            {resumes?.map((item, i) => (
              <motion.button
                key={item.resume.id || `resume-${item.updatedAt}-${i}`}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(item)}
                aria-label={item.resume.title || t("selectResume.untitled")}
                className="flex flex-col gap-1.5 text-left sm:gap-2"
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-xl transition-shadow",
                    "ring-1 ring-line hover:ring-2 hover:ring-brand/40",
                    "shadow-sm hover:shadow-md",
                  )}
                >
                  <ScaledResumePreview resume={item.resume} />
                </div>
                <div className="px-0.5">
                  <p className="text-xs sm:text-sm font-medium truncate text-text">
                    {item.resume.title || t("selectResume.untitled")}
                  </p>
                  <p className="text-[11px] sm:text-xs text-text-secondary">
                    {dateFormatter.format(new Date(item.updatedAt))}
                  </p>
                </div>
              </motion.button>
            ))}

            {resumes?.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <FileText size={28} className="text-text-secondary" />
                <div>
                  <p className="font-medium">{t("selectResume.empty.title")}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    {t("selectResume.empty.subtitle")}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
