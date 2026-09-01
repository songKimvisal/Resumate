import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useJobAnalyses } from "../../hooks/useJobAnalyses";

/** Remaining interview sets / job reports share the job-analysis quota. */
export default function UsageQuotaBanner({
  kind,
}: {
  kind: "interview" | "reports";
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { remaining } = useJobAnalyses();
  const ns = kind === "interview" ? "interviewPrep" : "savedJobsPage";
  const depleted = remaining <= 0;

  return (
    <div className="flex items-center gap-1.5 self-start">
      <span
        title={t(`${ns}.quotaHint`)}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-bg py-1 pl-1 pr-3"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold tabular-nums text-white">
          {remaining}
        </span>
        <span className="text-sm text-text">{t("common.leftInPack")}</span>
      </span>
      {depleted ? (
        <button
          type="button"
          onClick={() => navigate("/billing")}
          className="rounded-full px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
        >
          {t(`${ns}.quotaBuy`)}
        </button>
      ) : null}
    </div>
  );
}
