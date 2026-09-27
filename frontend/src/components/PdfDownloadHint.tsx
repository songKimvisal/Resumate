import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { usePdfSaves } from "../hooks/usePdfSaves";
import { cn } from "../lib/utils";

export default function PdfDownloadHint({
  resumeId,
  className,
}: {
  resumeId: string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  const { downloadState, remaining } = usePdfSaves();
  const state = downloadState(resumeId);

  if (state === "unlocked") {
    return (
      <p className={cn("flex items-start gap-1.5 text-xs text-success", className)}>
        <CheckCircle2 size={14} strokeWidth={2} className="mt-px shrink-0" />
        <span>{t("pdfAccess.unlocked")}</span>
      </p>
    );
  }

  return (
    <p className={cn("text-xs text-text-secondary", className)}>
      {state === "available"
        ? t("pdfAccess.willUnlock", { count: remaining })
        : t("pdfAccess.outOfPdfs")}
    </p>
  );
}
