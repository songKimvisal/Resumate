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
    <div className={cn("mt-4 flex items-center gap-2 sm:mt-5", className)}>
      <Button
        variant="ghost"
        size="compact"
        className="h-9 max-w-[48%] shrink-0 rounded-full px-2.5 text-text-secondary hover:bg-surface-2 hover:text-text sm:max-w-none sm:px-3"
        onClick={onBack}
      >
        <ArrowLeft size={15} />
        <span className="truncate">{backLabel}</span>
      </Button>
      {nextLabel && onNext ? (
        <Button
          size="compact"
          className="h-9 min-w-0 flex-1 rounded-full sm:ml-auto sm:flex-none sm:px-5"
          disabled={nextDisabled}
          onClick={onNext}
        >
          <span className="truncate">{nextLabel}</span>
          <ArrowRight size={15} />
        </Button>
      ) : null}
    </div>
  );
}
