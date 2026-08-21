import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";
import JourneyLayout from "../../components/dashboard/JourneyLayout";
import { useAuth } from "../../hooks/UseAuth";
import { useResumeStore } from "../../store/resumeStore";
import { useJourneyStore } from "../../store/journeyStore";

/** Job readiness report as step 4 of the job-readiness journey. */
export default function JobReadiness() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const resumeId = useResumeStore((s) => s.resume.id);
  const reachStep = useJourneyStore((s) => s.reachStep);

  useEffect(() => {
    if (user && resumeId) reachStep(user.id, resumeId, 3);
  }, [user, resumeId, reachStep]);

  return (
    <JourneyLayout
      activeIndex={3}
      backLabel={t("dashboard.steps.interviewPrep")}
      onBack={() => navigate("/job-match/interview-prep")}
    >
      <ComingSoon
        compact
        icon={Flag}
        title={t("dashboard.steps.jobReadinessReport")}
      />
    </JourneyLayout>
  );
}
