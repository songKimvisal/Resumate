import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, FileText, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { getResumesByUser, deleteResume } from "../../lib/api";
import type { DashboardResume } from "../../lib/api";
import { downloadResumePdf } from "../../lib/downloadResumePdf";
import { Button } from "../../components/ui/button";
import ResumeCard from "../../components/ui/dashboard/ResumeCard";

export default function MyResumes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const setResume = useResumeStore((s) => s.setResume);
  const resetResume = useResumeStore((s) => s.resetResume);

  const [resumes, setResumes] = useState<DashboardResume[] | null>(null);
  const [loadError, setLoadError] = useState(false);

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

  const handleNewResume = () => {
    resetResume();
    navigate("/builder");
  };

  const handleContinue = (item: DashboardResume) => {
    setResume(item.resume);
    navigate("/builder");
  };

  const handleDownload = (item: DashboardResume) =>
    downloadResumePdf(item.resume);

  const handleDelete = async (id: string) => {
    await deleteResume(id);
    setResumes((prev) => prev?.filter((r) => r.resume.id !== id) ?? prev);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold">
        <span className="text-text">{t("myResumes.title")}</span>{" "}
        <span className="text-brand">{t("myResumes.titleAccent")}</span>
      </h1>
      <p className="text-sm text-text-secondary mt-2">
        {t("myResumes.subtitle")}{" "}
        <Link to="/billing" className="underline font-medium text-text">
          {t("myResumes.upgradeLink")}
        </Link>
      </p>

      {resumes === null && !loadError && (
        <div className="flex items-center justify-center py-24 text-text-secondary">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      {loadError && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-sm text-text-secondary">
            {t("myResumes.loadError")}
          </p>
          <Button size="sm" variant="outline" onClick={retryLoad}>
            {t("myResumes.retry")}
          </Button>
        </div>
      )}

      {resumes !== null && !loadError && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <button
            onClick={handleNewResume}
            className="aspect-[210/297] rounded-lg border-2 border-dashed border-line flex flex-col items-center justify-center gap-3 text-text-secondary hover:text-brand hover:border-brand/50 transition-colors"
          >
            <span className="font-semibold text-text">
              {t("myResumes.newResume")}
            </span>
            <span className="size-9 rounded-full border-2 border-current inline-flex items-center justify-center">
              <Plus size={18} strokeWidth={2} />
            </span>
          </button>

          {resumes.map((item) => (
            <ResumeCard
              key={item.resume.id}
              resume={item.resume}
              updatedAt={item.updatedAt}
              onContinue={() => handleContinue(item)}
              onDownload={() => handleDownload(item)}
              onDelete={() => handleDelete(item.resume.id as string)}
            />
          ))}

          {resumes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileText size={28} className="text-text-secondary" />
              <div>
                <p className="font-medium">{t("myResumes.empty.title")}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {t("myResumes.empty.subtitle")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
