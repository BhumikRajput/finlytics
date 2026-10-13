import Link from "next/link";
import { Compass } from "lucide-react";

// Shown for any URL that doesn't exist. Lives at the app root (not inside (app)) because
// unmatched URLs only ever use the root not-found file. The proxy sends signed-out
// visitors to /login before they get here, so the link below is safe for everyone.
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
          <Compass size={20} />
        </div>
        <h1 className="mt-4 font-display text-[18px] font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          This page doesn&apos;t exist or has moved. Check the address, or head back to your
          dashboard.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
