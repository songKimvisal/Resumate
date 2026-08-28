import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export default function StepActions({
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
  className,
}: {
  backLabel: string;
  nextLabel?: string;
  onBack: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-20",
        "px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        "min-[375px]:px-4 sm:px-6",
        "lg:left-[var(--dashboard-sidebar-width,13rem)]",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex w-full min-w-0 max-w-6xl items-center gap-1.5 overflow-hidden rounded-full border border-line bg-bg/90 p-1.5 shadow-lg backdrop-blur-md min-[375px]:gap-2 min-[375px]:p-2">
        <Button
          variant="ghost"
          size="compact"
          className={cn(
            "h-8 min-w-0 shrink overflow-hidden rounded-full px-2 text-xs text-text-secondary hover:bg-surface-2 hover:text-text min-[375px]:h-9 min-[375px]:px-2.5 min-[375px]:text-sm sm:px-3",
            nextLabel && onNext ? "max-w-[46%] sm:max-w-none" : "",
          )}
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          <span className="min-w-0 truncate">{backLabel}</span>
        </Button>
        {nextLabel && onNext ? (
          <Button
            size="compact"
            className="h-8 min-w-0 flex-1 overflow-hidden rounded-full px-2.5 text-xs min-[375px]:h-9 min-[375px]:px-3 min-[375px]:text-sm sm:ml-auto sm:flex-none sm:px-5"
            disabled={nextDisabled}
            onClick={onNext}
          >
            <span className="min-w-0 truncate">{nextLabel}</span>
            <ArrowRight size={15} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
