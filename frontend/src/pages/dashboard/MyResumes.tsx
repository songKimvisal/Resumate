import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Loader2, Trash2, X } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import {
  getResumesByUser,
  deleteResume,
  deleteResumes,
  renameResume,
} from "../../lib/api";
import type { DashboardResume } from "../../lib/api";
import { saveResumePdf } from "../../lib/saveResumePdf";
import { Button } from "../../components/ui/button";
import ResumeCard from "../../components/ui/dashboard/ResumeCard";
import PageTitle from "../../components/layout/PageTitle";
import { useJourneyStore } from "../../store/journeyStore";
import { usePdfSaves } from "../../hooks/usePdfSaves";
import UpgradePlanModal from "../billing/UpgradePlanModal";
import mascot from "../../assets/logo/mascot.png";

export default function MyResumes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const setResume = useResumeStore((s) => s.setResume);
  const resetResume = useResumeStore((s) => s.resetResume);

  const [resumes, setResumes] = useState<DashboardResume[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { canSave } = usePdfSaves();

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

  const forgetDeleted = (ids: string[]) => {
    const activeId = useResumeStore.getState().resume.id;
    if (activeId && ids.includes(activeId)) resetResume();
    if (user) {
      for (const id of ids) {
        useJourneyStore.getState().forgetResume(user.id, id);
      }
    }
  };

  const handleNewResume = () => {
    resetResume();
    navigate("/marketplace");
  };

  const handleContinue = (item: DashboardResume) => {
    setResume(item.resume);
    navigate("/builder");
  };

  const handleDownload = async (item: DashboardResume) => {
    if (!canSave) {
      setUpgradeOpen(true);
      return;
    }
    try {
      const result = await saveResumePdf(item.resume);
      if (result === "quota") setUpgradeOpen(true);
    } catch {
    }
  };

  const handleDelete = async (id: string) => {
    await deleteResume(id);
    setResumes((prev) => prev?.filter((r) => r.resume.id !== id) ?? prev);
    setSelectedIds((prev) => prev.filter((selected) => selected !== id));
    forgetDeleted([id]);
  };

  const exitSelectMode = () => {
    setSelecting(false);
    setSelectedIds([]);
    setConfirmingBulk(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selected) => selected !== id) : [...prev, id],
    );
  };

  const selectableIds =
    resumes?.map((item) => item.resume.id).filter((id): id is string => Boolean(id)) ??
    [];

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : selectableIds);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeletingBulk(true);
    try {
      const ids = [...selectedIds];
      await deleteResumes(ids);
      setResumes(
        (prev) => prev?.filter((r) => !ids.includes(r.resume.id as string)) ?? prev,
      );
      forgetDeleted(ids);
      exitSelectMode();
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleRename = async (id: string, title: string) => {
    await renameResume(id, title);
    setResumes(
      (prev) =>
        prev?.map((r) =>
          r.resume.id === id ? { ...r, resume: { ...r.resume, title } } : r,
        ) ?? prev,
    );
  };

  const showSelect = (resumes?.length ?? 0) > 0;

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageTitle
            text={t("myResumes.title")}
            accent={t("myResumes.titleAccent")}
          />
          <p className="text-sm text-text-secondary mt-2">
            {t("myResumes.subtitle")}{" "}
            <Link to="/billing" className="underline font-medium text-text">
              {t("myResumes.upgradeLink")}
            </Link>
          </p>
        </div>
        {showSelect && !selecting && (
          <Button size="sm" variant="outline" onClick={() => setSelecting(true)}>
            {t("myResumes.select")}
          </Button>
        )}
      </div>

      {selecting && (
        <div className="sticky top-3 z-20 mt-6 rounded-2xl border border-line bg-bg/95 px-4 py-3 shadow-sm backdrop-blur-md">
          {confirmingBulk ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 text-sm text-text">
                {t("myResumes.confirmDeleteSelected", {
                  count: selectedIds.length,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={deletingBulk}
                  onClick={() => setConfirmingBulk(false)}
                >
                  {t("myResumes.menu.confirmCancel")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deletingBulk || selectedIds.length === 0}
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={14} />
                  {deletingBulk
                    ? t("myResumes.deletingSelected")
                    : t("myResumes.menu.confirmYes")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                    selectedIds.length > 0
                      ? "bg-brand text-white"
                      : "bg-surface-2 text-text-secondary"
                  }`}
                >
                  {selectedIds.length}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">
                    {selectedIds.length > 0
                      ? t("myResumes.selectedCount", {
                          count: selectedIds.length,
                        })
                      : t("myResumes.selectHint")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
                  {allSelected
                    ? t("myResumes.deselectAll")
                    : t("myResumes.selectAll")}
                </Button>
                <Button
                  size="sm"
                  variant={selectedIds.length > 0 ? "destructive" : "outline"}
                  disabled={selectedIds.length === 0}
                  onClick={() => setConfirmingBulk(true)}
                >
                  <Trash2 size={14} />
                  {t("myResumes.deleteSelected")}
                </Button>
                <button
                  type="button"
                  onClick={exitSelectMode}
                  aria-label={t("myResumes.cancelSelect")}
                  className="inline-flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {resumes !== null && !loadError && resumes.length === 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-bg">
          <div className="flex flex-col items-center gap-5 px-4 py-8 min-[375px]:px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-8 sm:py-8">
            <img
              src={mascot}
              alt=""
              className="w-24 shrink-0 select-none min-[375px]:w-28 sm:w-36 lg:w-40"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-base font-bold tracking-tight text-text sm:text-lg">
                {t("myResumes.empty.title")}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-text-secondary sm:max-w-none">
                {t("myResumes.empty.subtitle")}
              </p>
              <Button
                className="mt-4 h-9 rounded-full"
                size="compact"
                onClick={handleNewResume}
              >
                {t("myResumes.empty.cta")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {resumes !== null && !loadError && resumes.length > 0 && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {!selecting && (
            <button
              type="button"
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
          )}

          {resumes.map((item, i) => {
            const id = item.resume.id as string;
            return (
              <ResumeCard
                key={id || `resume-${item.updatedAt}-${i}`}
                resume={item.resume}
                updatedAt={item.updatedAt}
                selecting={selecting}
                selected={selectedIds.includes(id)}
                onToggleSelect={() => toggleSelect(id)}
                onContinue={() => handleContinue(item)}
                onDownload={() => handleDownload(item)}
                onDelete={() => handleDelete(id)}
                onRename={(title) => handleRename(id, title)}
              />
            );
          })}
        </div>
      )}
    </div>
    <UpgradePlanModal
      open={upgradeOpen}
      onClose={() => setUpgradeOpen(false)}
      initialNeed="both"
      onSelectPack={(packId) => {
        setUpgradeOpen(false);
        navigate("/billing/payment", { state: { pack: packId } });
      }}
    />
    </>
  );
}
