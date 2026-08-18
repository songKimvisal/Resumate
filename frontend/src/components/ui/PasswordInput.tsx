import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & FieldProps
>(({ label, hint, error, className, id, ...props }, ref) => {
  const inputId = id ?? React.useId();
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={cn(
            "w-full h-10 pl-3 pr-10 rounded-lg border bg-bg text-sm text-text",
            "placeholder:text-text-placeholder",
            "focus:outline-none focus:ring-2 focus:ring-ring/50",
            "transition-colors",
            error
              ? "border-destructive focus:border-destructive"
              : "border-line focus:border-ring",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-text-placeholder hover:text-text-secondary transition-colors"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-text-placeholder">{hint}</p>
      )}
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
