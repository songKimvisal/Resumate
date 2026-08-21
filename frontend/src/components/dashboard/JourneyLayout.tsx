import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/UseAuth";
import DashboardSteps from "./DashboardSteps";
import StepActions from "./StepActions";

export default function JourneyLayout({
  activeIndex,
  children,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
}: {
  activeIndex: number;
  children: ReactNode;
  backLabel: string;
  nextLabel?: string;
  onBack: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-clip px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] min-[375px]:px-4 sm:px-6 sm:py-7">
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="break-words text-xl font-bold leading-tight min-[375px]:text-[1.65rem] sm:text-2xl">
          <span className="text-text">
            {t("dashboard.welcomeTitle", { name: "" })}
          </span>{" "}
          <span className="break-words italic text-brand">{fullName}</span>
        </h1>
        <p className="max-w-2xl text-sm leading-5 text-text-secondary sm:leading-6">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="mt-4 min-w-0 sm:mt-5">
        <DashboardSteps activeIndex={activeIndex} />
      </div>

      <div className="mt-5">{children}</div>

      <StepActions
        backLabel={backLabel}
        nextLabel={nextLabel}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={nextDisabled}
      />
    </div>
  );
}
