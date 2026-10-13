"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/auth-actions";
import { PASSWORD_MIN } from "@/lib/auth-validation";
import { PasswordInput } from "./PasswordInput";
import { authInputClass, authPrimaryButtonClass } from "./styles";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="name" className="text-[13px] font-medium text-ink-muted">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={state?.name}
          placeholder="Alex Morgan"
          className={authInputClass}
        />
      </div>

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

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        autoComplete="new-password"
        placeholder={`At least ${PASSWORD_MIN} characters`}
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        autoComplete="new-password"
      />

      {state?.error && (
        <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-[12.5px] text-negative">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authPrimaryButtonClass}>
        {pending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
