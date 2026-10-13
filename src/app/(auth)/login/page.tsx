import Link from "next/link";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth.config";
import { getCurrentUserId } from "@/lib/current-user";
import { safeRedirect } from "@/lib/auth-validation";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { LoginForm } from "@/components/auth/LoginForm";

// Errors Auth.js appends to /login?error=... after a failed redirect-based sign-in,
// plus SessionExpired, which the (app) layout adds when the cookie is valid but the
// account no longer exists
const URL_ERRORS: Record<string, string> = {
  AccessDenied: "Google sign-in was denied, or your Google email isn't verified.",
  CredentialsSignin: "Invalid email or password.",
  Configuration: "Sign-in isn't configured correctly. Please contact the site owner.",
  SessionExpired: "Your session has expired. Please sign in again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeRedirect(callbackUrl);

  // Strict check (it also confirms the account exists). With the cookie-only check, a
  // cookie for a deleted account sent the visitor to "/", the (app) layout sent them back
  // here, and the browser ended in a redirect loop.
  if (await getCurrentUserId()) redirect(redirectTo);

  const urlError = error ? (URL_ERRORS[error] ?? "Sign-in failed. Please try again.") : undefined;
  const registerHref =
    redirectTo === "/" ? "/register" : `/register?callbackUrl=${encodeURIComponent(redirectTo)}`;

  return (
    <>
      <h1 className="font-display text-[18px] font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-[13px] text-ink-faint">Sign in to see your finances.</p>

      <div className="mt-5 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton callbackUrl={redirectTo} label="Continue with Google" />
            <div className="flex items-center gap-3 text-[12px] text-ink-faint">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <LoginForm callbackUrl={redirectTo} urlError={urlError} />
      </div>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        New to Finlytics?{" "}
        <Link href={registerHref} className="font-medium text-primary hover:text-primary-dark">
          Create an account
        </Link>
      </p>
    </>
  );
}
