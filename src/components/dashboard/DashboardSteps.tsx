import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

const STEPS = [
  "dashboard.steps.selectResume",
  "dashboard.steps.resumeOptimization",
  "dashboard.steps.interviewPrep",
  "dashboard.steps.jobReadinessReport",
] as const;

/** 0-based index of the current active step in the readiness journey. */
export default function DashboardSteps({ activeIndex }: { activeIndex: number }) {
  const { t } = useTranslation();

  return (
    <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:w-max sm:items-center sm:gap-0">
        {STEPS.map((step, index) => {
          const isActive = index <= activeIndex;
          return (
            <div
              key={step}
              className="min-w-0 sm:flex sm:shrink-0 sm:items-center"
            >
              <span
                className={cn(
                  "flex min-h-10 w-full items-center justify-center rounded-xl border px-2 py-1.5 text-center",
                  "min-[375px]:px-3 min-[375px]:py-2",
                  "sm:inline-flex sm:min-h-0 sm:w-auto sm:rounded-full sm:px-5 sm:py-2.5",
                  "text-[10px] min-[375px]:text-[11px] sm:text-sm",
                  "font-semibold leading-snug sm:whitespace-nowrap",
                  isActive
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-surface-2 text-text-secondary",
                )}
              >
                {t(step)}
              </span>

              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    "hidden sm:block sm:mx-2 h-px w-6 sm:w-10 lg:w-16 shrink-0",
                    index < activeIndex
                      ? "bg-gradient-to-r from-brand to-brand/40"
                      : index === activeIndex
                        ? "bg-gradient-to-r from-brand to-line"
                        : "bg-line",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
