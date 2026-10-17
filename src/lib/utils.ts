export type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class-name joiner (drops the `clsx`/`tailwind-merge` deps —
 * our design system keeps variant strings non-conflicting by construction).
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
