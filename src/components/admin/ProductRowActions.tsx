"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteProductAction } from "@/app/admin/products/actions";
import { Button } from "@/components/ui/Button";

/** Edit link + delete (with confirm) for a product row. */
export function ProductRowActions({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: "active" | "archived";
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <form action={deleteProductAction} className="flex items-center justify-end gap-1">
        <input type="hidden" name="id" value={id} />
        <span className="text-xs text-ink-500">Delete “{name.slice(0, 16)}…”?</span>
        <Button type="submit" size="sm" variant="danger" className="h-8 px-2.5 text-xs">
          Yes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs"
          onClick={() => setConfirming(false)}
        >
          No
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/products/${id}`}
        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-50 hover:text-ink"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-400 hover:bg-eraser-soft hover:text-[#8c3b34]"
        aria-label={`Delete ${name}${status === "archived" ? " (archived)" : ""}`}
      >
        Delete
      </button>
    </div>
  );
}
