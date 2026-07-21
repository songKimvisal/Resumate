import { useTranslation } from "react-i18next";
import { Receipt } from "lucide-react";
import ComingSoon from "../../components/ui/dashboard/ComingSoon";

export default function Billing() {
  const { t } = useTranslation();
  return <ComingSoon icon={Receipt} title={t("nav.billing")} />;
}
