/** Inline SVG brand mark — no icon library, tiny payload, safe in any bundle. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="8" fill="#1F3A5F" />
      <path
        d="M12 27.5L23.2 12.8c.5-.7 1.5-.7 2 0l2.2 2.9c.5.7.5 1.6 0 2.3L18.4 29H12v-1.5z"
        fill="#C9A961"
      />
      <path d="M25.5 15.8l2.2 2.9" stroke="#1F3A5F" strokeWidth="1.4" />
      <circle cx="14.5" cy="26.5" r="1.6" fill="#F7F8FA" />
    </svg>
  );
}
