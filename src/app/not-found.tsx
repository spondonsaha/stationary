import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-pencil">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-500">
        The page you were looking for slipped off the desk.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
      >
        Back to home
      </Link>
    </div>
  );
}
