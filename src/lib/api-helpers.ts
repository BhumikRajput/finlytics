// Small helpers shared by the API routes. Server-side only.

export const toCents = (n: number) => Math.round(n * 100);
export const fromCents = (c: number) => c / 100;

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
export const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });
export const notFound = (message = "Not found") => Response.json({ error: message }, { status: 404 });
export const conflict = (message: string) => Response.json({ error: message }, { status: 409 });

// Request bodies are never trusted: a bad or missing body becomes null, which the
// validators below reject with a 400.
export const readJson = (req: Request): Promise<unknown> => req.json().catch(() => null);

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (error: string): Result<never> => ({ ok: false, error });

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Category keys are slugs ("food", "gym-membership"); see slugify() in categories-context.tsx
export const CATEGORY_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const ID_MAX = 100;

// Keeps amounts inside what an Int column and a sane budget can hold
export const MAX_AMOUNT = 1_000_000_000;

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function parseCategory(v: unknown, field = "category"): Result<string> {
  if (typeof v !== "string" || !CATEGORY_RE.test(v)) {
    return fail(`"${field}" must be a category key like "food" or "gym-membership".`);
  }
  return ok(v);
}

// Prisma error code for "unique constraint failed"
export const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
