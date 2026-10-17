import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      "h-11 w-full rounded-md border bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-300",
      "transition-colors focus:border-ink-400",
      invalid ? "border-eraser" : "border-ink-200",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300",
      "transition-colors focus:border-ink-400",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900",
      "transition-colors focus:border-ink-400",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
        {label}
        {required ? (
          <span className="text-eraser" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-400">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-eraser">
          {error}
        </p>
      ) : null}
    </div>
  );
}
