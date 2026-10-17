"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * Search box navigates to /products?q=... via the URL — results are
 * server-rendered, so this stays a ~1 KB client component.
 */
export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    const category = params.get("category");
    if (category) search.set("category", category);
    startTransition(() => {
      router.push(`/products${search.size ? `?${search}` : ""}`);
    });
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={`relative w-full max-w-md ${className}`}
    >
      <label htmlFor="store-search" className="sr-only">
        Search products
      </label>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <input
        id="store-search"
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search pens, notebooks…"
        className="h-10 w-full rounded-md border border-ink-200 bg-white pl-9 pr-16 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-ink-400"
        autoComplete="off"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-md bg-ink px-3 text-xs font-medium text-paper-50 btn-press"
        disabled={isPending}
      >
        {isPending ? "…" : "Search"}
      </button>
    </form>
  );
}
