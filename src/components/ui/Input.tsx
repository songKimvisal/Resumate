import * as React from "react";
import { cn } from "../../lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, hint, className, id, ...props }, ref) => {
  const inputId = id ?? React.useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full h-10 px-3 rounded-lg border border-line bg-bg text-sm text-text",
          "placeholder:text-text-placeholder",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
          "transition-colors",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-xs text-text-placeholder">{hint}</p>}
    </div>
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(({ label, hint, className, id, ...props }, ref) => {
  const inputId = id ?? React.useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full min-h-28 p-3 rounded-lg border border-line bg-bg text-sm text-text resize-y",
          "placeholder:text-text-placeholder",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
          "transition-colors",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-xs text-text-placeholder">{hint}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";
