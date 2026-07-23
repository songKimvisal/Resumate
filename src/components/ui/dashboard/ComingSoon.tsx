import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

export default function ComingSoon({
  icon: Icon,
  title,
  heading,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  heading?: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-24 text-center">
        <Icon size={28} className="text-text-secondary" />
        <div>
          <p className="font-medium">{heading ?? t("common.comingSoon")}</p>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
            {description ?? t("common.comingSoonSubtitle")}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}
