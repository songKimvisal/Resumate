import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { Button } from "../../components/ui/button";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold">
        {t("dashboard.welcomeTitle", { name: fullName })}
      </h1>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line py-24 text-center">
        <LayoutGrid size={28} className="text-text-secondary" />
        <div>
          <p className="font-medium">{t("dashboard.comingSoonTitle")}</p>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
            {t("dashboard.comingSoonSubtitle")}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/my-resumes")}>
          {t("dashboard.goToMyResumes")}
        </Button>
      </div>
    </div>
  );
}
