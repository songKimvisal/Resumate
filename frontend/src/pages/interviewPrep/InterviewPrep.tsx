import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MessagesSquare } from "lucide-react";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/UseAuth";
import { useJourneyStore, useJourneyDraft, useJourneyHydrated } from "../../store/journeyStore";

export default function InterviewPrep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hydrated = useJourneyHydrated();
  const lastResumeId = useJourneyStore((s) =>
    s.lastUserId === user?.id ? s.lastResumeId : null,
  );
  const draft = useJourneyDraft(user?.id, lastResumeId);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center px-4 py-24 text-text-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="ml-3 text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  if (draft?.analysis || draft?.jobText) {
    return <Navigate to="/job-match/interview-prep" replace />;
  }

  return (
    <ComingSoon
      icon={MessagesSquare}
      title={t("nav.interviewPrep")}
      heading={t("interviewPrep.emptyTitle")}
      description={t("interviewPrep.emptyBody")}
      action={
        <Button
          className="mt-2 rounded-full"
          size="compact"
          onClick={() => navigate("/job-match")}
        >
          {t("interviewPrep.startJobMatch")}
        </Button>
      }
    />
  );
}
