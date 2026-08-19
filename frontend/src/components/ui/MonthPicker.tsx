import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../../lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parses a "YYYY-MM" value into its numeric parts, or null if empty/invalid */
function parse(value: string | undefined) {
  if (!value) return null;
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m };
}

function format(value: string) {
  const parsed = parse(value);
  if (!parsed) return "";
  return new Date(parsed.year, parsed.month - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Compact month+year picker matching the "YYYY-MM" strings the resume
 *  model stores — a full day-grid calendar would let users pick a day this
 *  data has no room for, so this is a 12-month grid with a year stepper. */
export function MonthPicker({
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "YYYY-MM" lower bound (inclusive) */
  min?: string;
  /** "YYYY-MM" upper bound (inclusive) */
  max?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const minParsed = parse(min);
  const maxParsed = parse(max);
  const [viewYear, setViewYear] = useState(
    selected?.year ?? maxParsed?.year ?? new Date().getFullYear(),
  );

  const isDisabled = (year: number, month: number) => {
    if (minParsed && (year < minParsed.year || (year === minParsed.year && month < minParsed.month)))
      return true;
    if (maxParsed && (year > maxParsed.year || (year === maxParsed.year && month > maxParsed.month)))
      return true;
    return false;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setViewYear(selected?.year ?? maxParsed?.year ?? new Date().getFullYear());
        setOpen(next);
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          // min-w-0 is load-bearing: an inline-flex element won't shrink
          // below its content's intrinsic width otherwise, no matter what
          // its ancestors or its own w-full say — the exact same class of
          // bug the native month input had, just self-inflicted this time
          "w-full min-w-0 h-10 px-3 rounded-lg border border-line bg-bg text-sm text-left inline-flex items-center gap-2",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !value && "text-text-placeholder",
          className,
        )}
      >
        <CalendarDays size={15} className="shrink-0 text-text-placeholder" />
        <span className="flex-1 min-w-0 truncate">{value ? format(value) : placeholder}</span>
      </PopoverTrigger>

      <PopoverContent className="w-56">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="size-7 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-2 hover:text-text transition-colors"
            aria-label="Previous year"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-text">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="size-7 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-2 hover:text-text transition-colors"
            aria-label="Next year"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((label, i) => {
            const month = i + 1;
            const isSelected = selected?.year === viewYear && selected?.month === month;
            const blocked = isDisabled(viewYear, month);
            return (
              <button
                key={label}
                type="button"
                disabled={blocked}
                onClick={() => {
                  onChange(`${viewYear}-${String(month).padStart(2, "0")}`);
                  setOpen(false);
                }}
                className={cn(
                  "h-9 rounded-md text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-brand text-white"
                    : "text-text hover:bg-surface-2",
                  blocked && "opacity-30 pointer-events-none",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
