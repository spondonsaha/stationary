"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Copy the public invoice link to the clipboard. */
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this invoice link:", url);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy} aria-live="polite">
      {copied ? "Copied!" : "Copy public link"}
    </Button>
  );
}
