import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessagesSquare } from "lucide-react";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";
import JourneyLayout from "../../components/dashboard/JourneyLayout";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { useJourneyStore } from "../../store/journeyStore";

/** Interview prep as step 3 of the job-readiness journey (after job match). */
export default function ProcessInterviewPrep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const resumeId = useResumeStore((s) => s.resume.id);
  const reachStep = useJourneyStore((s) => s.reachStep);

  useEffect(() => {
    if (user && resumeId) reachStep(user.id, resumeId, 2);
  }, [user, resumeId, reachStep]);

  return (
    <JourneyLayout
      activeIndex={2}
      backLabel={t("dashboard.steps.resumeOptimization")}
      nextLabel={t("dashboard.steps.jobReadinessReport")}
      onBack={() => navigate("/job-match")}
      onNext={() => navigate("/job-readiness")}
    >
      <ComingSoon
        compact
        icon={MessagesSquare}
        title={t("dashboard.steps.interviewPrep")}
      />
    </JourneyLayout>
  );
}
