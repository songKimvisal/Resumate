import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { Button } from "../../components/ui/button";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "";

  return (
    <ComingSoon
      icon={LayoutGrid}
      title={t("dashboard.welcomeTitle", { name: fullName })}
      heading={t("dashboard.comingSoonTitle")}
      description={t("dashboard.comingSoonSubtitle")}
      action={
        <Button size="sm" onClick={() => navigate("/my-resumes")}>
          {t("dashboard.goToMyResumes")}
        </Button>
      }
    />
  );
}
