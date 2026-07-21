import { useTranslation } from "react-i18next";
import { PieChart } from "lucide-react";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";

export default function AiUsage() {
  const { t } = useTranslation();
  return <ComingSoon icon={PieChart} title={t("nav.aiUsage")} />;
}
