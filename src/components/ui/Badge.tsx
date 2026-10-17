import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-50 text-ink-600 border-ink-100",
    success: "bg-leaf-soft text-leaf border-leaf/25",
    warning: "bg-pencil-100 text-pencil-500 border-pencil-200",
    danger: "bg-eraser-soft text-eraser border-eraser/25",
    info: "bg-ink-50 text-ink-500 border-ink-100",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} aria-hidden />;
}
