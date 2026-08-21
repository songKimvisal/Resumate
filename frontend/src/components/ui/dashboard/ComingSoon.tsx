import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

export default function ComingSoon({
  icon: Icon,
  title,
  heading,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  heading?: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const card = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line text-center",
        compact ? "py-16" : "mt-10 py-24",
      )}
    >
      <Icon size={28} className="text-text-secondary" />
      <div>
        <p className="font-medium">{heading ?? t("common.comingSoon")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          {description ?? t("common.comingSoonSubtitle")}
        </p>
      </div>
      {action}
    </div>
  );

  if (compact) return card;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {card}
    </div>
  );
}
