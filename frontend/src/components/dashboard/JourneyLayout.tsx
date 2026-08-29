import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { Button } from "../ui/button";
import DashboardSteps from "./DashboardSteps";
import StepActions from "./StepActions";
import { cn } from "../../lib/utils";

export default function JourneyLayout({
  activeIndex,
  children,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
  hideIntro,
  hideBack,
}: {
  activeIndex: number;
  children: ReactNode;
  backLabel?: string;
  nextLabel?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  hideIntro?: boolean;
  hideBack?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const showBack = Boolean(!hideBack && backLabel && onBack);
  const showNext = Boolean(nextLabel && onNext);
  const inlineActions = Boolean(hideIntro);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl overflow-x-clip px-3 py-4 min-[375px]:px-4 sm:px-6 sm:py-7",
        inlineActions
          ? "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          : "pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]",
      )}
    >
      {inlineActions && (showBack || showNext) ? (
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2.5 sm:mb-5">
          {showBack ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 max-w-full rounded-full px-3.5"
              onClick={onBack}
            >
              <ArrowLeft size={14} strokeWidth={2.4} />
              <span className="truncate">{backLabel}</span>
            </Button>
          ) : (
            <span />
          )}
          {showNext ? (
            <Button
              size="sm"
              className="h-8 max-w-full rounded-full px-3.5"
              disabled={nextDisabled}
              onClick={onNext}
            >
              <span className="truncate">{nextLabel}</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </Button>
          ) : null}
        </div>
      ) : null}

      {!hideIntro ? (
        <>
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
        </>
      ) : null}

      <div className={hideIntro ? "min-w-0" : "mt-5 min-w-0"}>{children}</div>

      {!inlineActions ? (
        <StepActions
          backLabel={showBack ? backLabel : undefined}
          nextLabel={nextLabel}
          onBack={showBack ? onBack : undefined}
          onNext={onNext}
          nextDisabled={nextDisabled}
        />
      ) : null}
    </div>
  );
}
