"use client";

import { useRef, useState } from "react";

/**
 * Image field: uploads to /api/admin/upload and stores the returned public
 * path in a hidden input. Also supports pasting an existing path.
 */
export function ImageUploader({
  name,
  initialValue = "",
  label = "Product image",
}: {
  name: string;
  initialValue?: string | null;
  label?: string;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) throw new Error(data.error ?? "Upload failed");
      setValue(data.path);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink-700">{label}</span>
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-24 w-24 overflow-hidden rounded-md border border-ink-200 bg-paper-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Selected product" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-ink-300">
              No image
            </span>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPick(f);
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex h-10 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press disabled:opacity-50"
            >
              {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => setValue("")}
                className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-ink-400 hover:bg-ink-50"
              >
                Clear
              </button>
            ) : null}
          </div>
          <p className="text-xs text-ink-400">JPEG, PNG, WebP, AVIF or SVG · max 4 MB</p>
        </div>
      </div>
      {error ? <p className="text-xs font-medium text-[#b3372c]">{error}</p> : null}
    </div>
  );
}
