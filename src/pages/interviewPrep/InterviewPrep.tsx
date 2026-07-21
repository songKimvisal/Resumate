import { useTranslation } from "react-i18next";
import { MessagesSquare } from "lucide-react";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";

export default function InterviewPrep() {
  const { t } = useTranslation();
  return <ComingSoon icon={MessagesSquare} title={t("nav.interviewPrep")} />;
}
