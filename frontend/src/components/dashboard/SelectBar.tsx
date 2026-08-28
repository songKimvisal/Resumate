import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

type SelectBarProps = {
  selectedCount: number;
  allSelected: boolean;
  confirming: boolean;
  selectHint: string;
  confirmMessage: string;
  onToggleAll: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelConfirm: () => void;
  onExit: () => void;
};

/** Same select-then-delete chrome as My Resumes. */
export default function SelectBar({
  selectedCount,
  allSelected,
  confirming,
  selectHint,
  confirmMessage,
  onToggleAll,
  onAskDelete,
  onConfirmDelete,
  onCancelConfirm,
  onExit,
}: SelectBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-3 z-20 mt-5 rounded-2xl border border-line bg-bg/95 px-3 py-3 shadow-sm backdrop-blur-md min-[375px]:mt-6 min-[375px]:px-4 sm:mt-8">
      {confirming ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-sm text-text">{confirmMessage}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onCancelConfirm}>
              {t("myResumes.menu.confirmCancel")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={selectedCount === 0}
              onClick={onConfirmDelete}
            >
              <Trash2 size={14} />
              {t("myResumes.menu.confirmYes")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                selectedCount > 0
                  ? "bg-brand text-white"
                  : "bg-surface-2 text-text-secondary"
              }`}
            >
              {selectedCount}
            </span>
            <p className="min-w-0 text-sm font-medium text-text">
              {selectedCount > 0
                ? t("myResumes.selectedCount", { count: selectedCount })
                : selectHint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onToggleAll}>
              {allSelected
                ? t("myResumes.deselectAll")
                : t("myResumes.selectAll")}
            </Button>
            <Button
              size="sm"
              variant={selectedCount > 0 ? "destructive" : "outline"}
              disabled={selectedCount === 0}
              onClick={onAskDelete}
            >
              <Trash2 size={14} />
              {t("myResumes.deleteSelected")}
            </Button>
            <button
              type="button"
              onClick={onExit}
              aria-label={t("myResumes.cancelSelect")}
              className="inline-flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
