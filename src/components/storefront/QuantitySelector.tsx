"use client";

export function QuantitySelector({
  value,
  onChange,
  max = 99,
  min = 1,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const dim = size === "sm" ? "h-9" : "h-11";
  const btn =
    size === "sm"
      ? "h-9 w-9 text-base"
      : "h-11 w-11 text-lg";

  return (
    <div
      className={`inline-flex ${dim} items-center rounded-md border border-ink-200 bg-white`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`${btn} inline-flex items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-30 btn-press`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`min-w-8 text-center text-sm font-semibold tabular-nums text-ink-900`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${btn} inline-flex items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-30 btn-press`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
