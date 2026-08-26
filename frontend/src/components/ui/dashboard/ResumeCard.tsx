import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, MoreHorizontal } from "lucide-react";
import type { Resume } from "../../../types/resume";
import ResumePreview from "../../resume/ResumePreview";
import { Button } from "../button";
import { cn } from "../../../lib/utils";

interface ResumeCardProps {
  resume: Resume;
  updatedAt: string;
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onContinue: () => void;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRename: (title: string) => Promise<void>;
}

export default function ResumeCard({
  resume,
  updatedAt,
  selecting = false,
  selected = false,
  onToggleSelect,
  onContinue,
  onDownload,
  onDelete,
  onRename,
}: ResumeCardProps) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(resume.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (selecting) {
      setMenuOpen(false);
      setConfirming(false);
    }
  }, [selecting]);

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const startRenaming = () => {
    setMenuOpen(false);
    setTitleDraft(resume.title);
    setRenaming(true);
  };

  useEffect(() => {
    if (renaming) titleInputRef.current?.select();
  }, [renaming]);

  const commitRename = async () => {
    const trimmed = titleDraft.trim();
    setRenaming(false);
    if (!trimmed || trimmed === resume.title) return;
    await onRename(trimmed);
  };

  const cancelRename = () => {
    setTitleDraft(resume.title);
    setRenaming(false);
  };

  const openCard = () => {
    if (selecting) {
      onToggleSelect?.();
      return;
    }
    onContinue();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={openCard}
        role="button"
        tabIndex={0}
        aria-pressed={selecting ? selected : undefined}
        onKeyDown={(e) => e.key === "Enter" && openCard()}
        className={cn(
          "relative rounded-lg border bg-white overflow-hidden cursor-pointer transition-shadow",
          selected
            ? "border-brand ring-2 ring-brand/40"
            : "border-line hover:ring-2 hover:ring-brand/40",
        )}
      >
        {selecting && (
          <span
            className={cn(
              "absolute top-2 left-2 z-10 size-6 rounded-md border-2 inline-flex items-center justify-center",
              selected
                ? "border-brand bg-brand text-white"
                : "border-line bg-white/90 text-transparent",
            )}
            aria-hidden
          >
            <Check size={14} strokeWidth={3} />
          </span>
        )}
        <div className="pointer-events-none">
          <ResumePreview singlePage resume={resume} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") cancelRename();
            }}
            placeholder={t("myResumes.untitled")}
            className="min-w-0 flex-1 rounded-md border border-brand bg-bg px-1.5 py-0.5 text-sm font-medium text-text focus:outline-none"
          />
        ) : (
          <button
            onClick={openCard}
            className="text-sm font-medium truncate hover:text-brand transition-colors"
          >
            {resume.title || t("myResumes.untitled")}
          </button>
        )}

        {!selecting && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t("myResumes.menu.open")}
              className="size-7 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-line bg-bg shadow-lg overflow-hidden z-10">
                {!confirming ? (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onContinue();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                    >
                      {t("myResumes.menu.continue")}
                    </button>
                    <button
                      onClick={startRenaming}
                      className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                    >
                      {t("myResumes.menu.rename")}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                      {downloading
                        ? t("myResumes.menu.downloading")
                        : t("myResumes.menu.download")}
                    </button>
                    <button
                      onClick={() => setConfirming(true)}
                      className="w-full text-left px-4 py-2 text-sm text-brand hover:bg-surface-2 transition-colors"
                    >
                      {t("myResumes.menu.delete")}
                    </button>
                  </>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-text-secondary">
                      {t("myResumes.menu.confirmDelete")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="destructive"
                        disabled={deleting}
                        onClick={handleDelete}
                      >
                        {deleting
                          ? t("myResumes.menu.deleting")
                          : t("myResumes.menu.confirmYes")}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={deleting}
                        onClick={() => setConfirming(false)}
                      >
                        {t("myResumes.menu.confirmCancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-text-secondary">
        {dateFormatter.format(new Date(updatedAt))}
      </p>
    </div>
  );
}
