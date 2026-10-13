// Pure helpers shared by the forms and the server actions. No Node-only imports,
// so this file can be used in the proxy, client components and server code.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;
// bcrypt only looks at the first 72 BYTES of a password, so longer ones are rejected
// instead of being silently truncated.
export const PASSWORD_MAX_BYTES = 72;
export const NAME_MAX = 80;

// State shape returned by the auth server actions (see src/lib/auth-actions.ts)
export type AuthFormState =
  | { error?: string; name?: string; email?: string }
  | undefined;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validateName(name: string): string | null {
  if (name.trim().length === 0) return "Please enter your name.";
  if (name.trim().length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  if (email.length > 254) return "That email address is too long.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes (about 72 characters).`;
  }
  return null;
}

// Only ever redirect to a path on THIS site (blocks open-redirects such as
// "//evil.com" or "https://evil.com"). Auth.js often hands us an absolute URL
// in ?callbackUrl=, so we keep only its path + query.
export function safeRedirect(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    const url = new URL(value, "http://placeholder.invalid");
    const target = url.pathname + url.search;
    if (target.startsWith("//")) return fallback;
    if (target.startsWith("/login") || target.startsWith("/register")) return fallback;
    if (target.startsWith("/api/")) return fallback;
    return target;
  } catch {
    return fallback;
  }
}
