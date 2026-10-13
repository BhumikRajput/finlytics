"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";
import { PasswordInput } from "./PasswordInput";
import { authInputClass, authPrimaryButtonClass } from "./styles";

export function LoginForm({ callbackUrl, urlError }: { callbackUrl: string; urlError?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const error = state?.error ?? urlError;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="email" className="text-[13px] font-medium text-ink-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          placeholder="you@example.com"
          className={authInputClass}
        />
      </div>

      <PasswordInput id="password" name="password" label="Password" autoComplete="current-password" />

      {error && (
        <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-[12.5px] text-negative">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authPrimaryButtonClass}>
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
