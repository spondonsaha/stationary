"use client";

export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        "inline-flex h-11 items-center justify-center rounded-md border border-ink-200 bg-white px-5 text-sm font-medium text-ink btn-press hover:border-ink-400"
      }
    >
      Print
    </button>
  );
}
