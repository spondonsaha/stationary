"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/BrandMark";

export function LoginForm({
  shopName,
  next,
}: {
  shopName: string;
  next: string;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-card border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md"
          aria-label={`${shopName} — back to home`}
        >
          <BrandMark className="h-9 w-9" />
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-ink">{shopName}</p>
            <p className="text-xs text-ink-400">Admin sign in</p>
          </div>
        </Link>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />

          {state?.error ? (
            <p
              role="alert"
              className="rounded-md border border-[#f5c9c4] bg-eraser-soft px-4 py-3 text-sm font-medium text-[#8c3b34]"
            >
              {state.error}
            </p>
          ) : null}

          <Field label="Email" htmlFor="admin-email" required>
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              placeholder="admin@example.com"
            />
          </Field>
          <Field label="Password" htmlFor="admin-password" required>
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-400">
          Sessions are stored in a secure httpOnly cookie and expire after 7 days.
        </p>
      </div>
    </div>
  );
}
