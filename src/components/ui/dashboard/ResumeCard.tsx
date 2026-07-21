import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal } from "lucide-react";
import type { Resume } from "../../../types/resume";
import ResumePreview from "../../resume/ResumePreview";
import { Button } from "../button";

interface ResumeCardProps {
  resume: Resume;
  updatedAt: string;
  onContinue: () => void;
  onDownload: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function ResumeCard({
  resume,
  updatedAt,
  onContinue,
  onDownload,
  onDelete,
}: ResumeCardProps) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={onContinue}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onContinue()}
        className="relative rounded-lg border border-line bg-white overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand/40 transition-shadow"
      >
        <div className="pointer-events-none">
          <ResumePreview singlePage resume={resume} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onContinue}
          className="text-sm font-medium truncate hover:text-brand transition-colors"
        >
          {resume.title || t("myResumes.untitled")}
        </button>

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
      </div>

      <p className="text-xs text-text-secondary">
        {dateFormatter.format(new Date(updatedAt))}
      </p>
    </div>
  );
}
