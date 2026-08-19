import { cn } from "../../lib/utils";

export function DotRating({
  value,
  onChange,
  max = 5,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n <= value}
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          className={cn(
            "size-5 shrink-0 rounded-full border transition-colors",
            n <= value
              ? "bg-brand border-brand"
              : "bg-transparent border-line hover:border-brand/50",
          )}
        />
      ))}
    </div>
  );
}
