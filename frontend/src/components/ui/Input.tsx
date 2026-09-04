import * as React from "react";
import { cn, useFieldId } from "../../lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  /** Optional adornment pinned to the input's right edge (e.g. a detected
   *  card brand badge). Purely visual - doesn't affect the input's value. */
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, hint, error, trailing, className, id, ...props }, ref) => {
  const inputId = useFieldId(id);
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            "w-full h-10 px-3 rounded-lg border bg-bg text-sm text-text",
            "placeholder:text-text-placeholder",
            "focus:outline-none focus:ring-2 focus:ring-ring/50",
            "transition-colors",
            trailing && "pr-14",
            error
              ? "border-destructive focus:border-destructive"
              : "border-line focus:border-ring",
            className,
          )}
          {...props}
          id={inputId}
        />
        {trailing && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {trailing}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-text-placeholder">{hint}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(({ label, hint, className, id, ...props }, ref) => {
  const inputId = useFieldId(id);
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-28 p-3 rounded-lg border border-line bg-bg text-sm text-text resize-y",
          "placeholder:text-text-placeholder",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
          "transition-colors",
          className,
        )}
        {...props}
        id={inputId}
      />
      {hint && <p className="text-xs text-text-placeholder">{hint}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";
