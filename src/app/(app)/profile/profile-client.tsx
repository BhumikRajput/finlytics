"use client";

import { useActionState } from "react";
import { Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { getInitials } from "@/lib/user";
import { signOutAction } from "@/lib/auth-actions";
import { changePasswordAction, updateNameAction } from "@/lib/profile-actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[13.5px] text-ink outline-none";
const primaryButtonClass =
  "rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50";

type ProfileClientProps = {
  name: string;
  email: string;
  hasPassword: boolean; // false for users who only ever signed in with Google
};

export function ProfileClient({ name, email, hasPassword }: ProfileClientProps) {
  const { darkMode, toggleDarkMode } = useTheme();

  const [nameState, nameAction, namePending] = useActionState(updateNameAction, undefined);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    undefined,
  );

  const passwordFields = [
    ...(hasPassword
      ? [
          {
            id: "current-password",
            name: "currentPassword",
            label: "Current Password",
            autoComplete: "current-password",
          },
        ]
      : []),
    { id: "new-password", name: "newPassword", label: "New Password", autoComplete: "new-password" },
    {
      id: "confirm-password",
      name: "confirmPassword",
      label: "Confirm New Password",
      autoComplete: "new-password",
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          Profile &amp; Settings
        </h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-5">
        {/* Profile information */}
        <form
          action={nameAction}
          className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
        >
          <h2 className="font-display text-[15px] font-semibold text-ink">Profile Information</h2>

          <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-[18px] font-display font-semibold text-white">
            {getInitials(name)}
          </div>

          <div className="mt-4">
            <label htmlFor="profile-name" className="text-[13px] font-medium text-ink-muted">
              Name
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              defaultValue={name}
              required
              maxLength={80}
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="profile-email" className="text-[13px] font-medium text-ink-muted">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              readOnly
              className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-line bg-canvas px-3 py-2 text-[13.5px] text-ink-faint outline-none"
            />
          </div>

          {nameState?.error && <p className="mt-3 text-[12.5px] text-negative">{nameState.error}</p>}
          {nameState?.ok && <p className="mt-3 text-[12.5px] text-primary-dark">Profile updated.</p>}

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={namePending} className={primaryButtonClass}>
              {namePending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Password */}
        <form
          action={passwordAction}
          className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
        >
          <h2 className="font-display text-[15px] font-semibold text-ink">
            {hasPassword ? "Change Password" : "Set a Password"}
          </h2>
          {!hasPassword && (
            <p className="mt-1 text-[12.5px] text-ink-faint">
              You signed in with Google. Set a password if you also want to log in with your email.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {passwordFields.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-[13px] font-medium text-ink-muted">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  name={f.name}
                  type="password"
                  autoComplete={f.autoComplete}
                  required
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {passwordState?.error && (
            <p className="mt-3 text-[12.5px] text-negative">{passwordState.error}</p>
          )}
          {passwordState?.ok && <p className="mt-3 text-[12.5px] text-primary-dark">Password updated.</p>}

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={passwordPending} className={primaryButtonClass}>
              {passwordPending ? "Saving…" : hasPassword ? "Update Password" : "Set Password"}
            </button>
          </div>
        </form>

        {/* Preferences */}
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <h2 className="font-display text-[15px] font-semibold text-ink">Preferences</h2>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas">
                <Moon size={16} className="text-ink-muted" />
              </div>
              <div>
                <p className="text-[13.5px] font-medium text-ink">Dark Mode</p>
                <p className="text-[12px] text-ink-faint">Switch between light and dark theme</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                darkMode ? "bg-primary" : "bg-line-strong"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  darkMode ? "translate-x-4.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Log out */}
        <form
          action={signOutAction}
          className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 sm:p-5"
        >
          <p className="text-[13.5px] text-ink-muted">Log out of your account</p>
          <button
            type="submit"
            className="rounded-lg border border-negative px-4 py-2 text-[13px] font-medium text-negative hover:bg-negative-soft"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}
