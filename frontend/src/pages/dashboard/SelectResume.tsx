import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, FileText, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Button } from "../../components/ui/button";
import ScaledResumePreview from "../../components/resume/ScaledResumePreview";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { getResumesByUser, type DashboardResume } from "../../lib/api";
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

  const handleBack = () => navigate(-1);

  const handleNewResume = () => {
    resetResume();
    navigate("/marketplace");
  };

  const handleSelect = (item: DashboardResume) => {
    setResume(item.resume);
    navigate("/dashboard");
  };

  const isLoading = resumes === null && !loadError;

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUpVariants}>
        <Button variant="default" className="rounded-full" onClick={handleBack}>
          <ChevronLeft size={18} strokeWidth={2.5} />
          {t("selectResume.back")}
        </Button>
      </motion.div>

      <motion.div variants={fadeUpVariants} className="mt-8 sm:mt-10 space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-secondary">
          {t("selectResume.title")}
        </h1>
        <p className="max-w-xl text-sm text-text-secondary/80 sm:text-base">
          {t("selectResume.subtitle")}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex items-center justify-center rounded-3xl border border-line bg-surface p-16 text-text-secondary"
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
            className="mt-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-line bg-surface p-16 text-center text-text-secondary"
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
            className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 lg:gap-6"
          >
            <motion.button
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewResume}
              className="aspect-[210/297] rounded-lg border-2 border-dashed border-line flex flex-col items-center justify-center gap-2 sm:gap-3 text-text-secondary hover:text-brand hover:border-brand/50 transition-colors"
            >
              <span className="font-semibold text-sm sm:text-base text-text text-center px-2">
                {t("selectResume.newResume")}
              </span>
              <span className="size-8 sm:size-9 rounded-full border-2 border-current inline-flex items-center justify-center">
                <Plus size={18} strokeWidth={2} />
              </span>
            </motion.button>

            {resumes?.map((item) => (
              <motion.button
                key={item.resume.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(item)}
                aria-label={item.resume.title || t("selectResume.untitled")}
                className="flex flex-col gap-2 text-left"
              >
                <div
                  className={cn(
                    "rounded-lg overflow-hidden transition-shadow",
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
