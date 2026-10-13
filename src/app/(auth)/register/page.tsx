import Link from "next/link";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth.config";
import { getCurrentUserId } from "@/lib/current-user";
import { safeRedirect } from "@/lib/auth-validation";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeRedirect(callbackUrl);

  // Strict check, same reason as the login page: a cookie for a deleted account must
  // not count as signed in, or the redirects loop.
  if (await getCurrentUserId()) redirect(redirectTo);

  const loginHref =
    redirectTo === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(redirectTo)}`;

  return (
    <>
      <h1 className="font-display text-[18px] font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-[13px] text-ink-faint">Start tracking your money in a minute.</p>

      <div className="mt-5 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton callbackUrl={redirectTo} label="Sign up with Google" />
            <div className="flex items-center gap-3 text-[12px] text-ink-faint">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <RegisterForm callbackUrl={redirectTo} />
      </div>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-primary hover:text-primary-dark">
          Sign in
        </Link>
      </p>
    </>
  );
}
