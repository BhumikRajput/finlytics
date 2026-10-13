// Server-side only: creates a user's categories the first time they are needed.
//
// Lazy on purpose instead of in registerAction: users are also created by the Google
// sign-in callback in src/auth.ts, and this way every route that needs categories goes
// through one function no matter how the account was made.
import { isUniqueViolation } from "./api-helpers";
import {
  CUSTOM_COLORS,
  DEFAULT_CATEGORIES,
  GENERIC_ICON,
  labelFromValue,
  type CategoryKind,
} from "./default-categories";
import { prisma } from "./prisma";

// Does nothing when the user already has categories.
//
// Besides the defaults it also creates a custom category for every key that the user's
// existing transactions or budgets use but the defaults don't contain. That covers data
// created before categories lived in the database (the old in-memory list had
// "gym-membership" and "side-hustle"), so nothing ends up pointing at a missing category.
// Those get the neutral icon; they can be renamed, and deleted like any custom category.
export async function ensureCategories(userId: string): Promise<void> {
  if ((await prisma.category.count({ where: { userId } })) > 0) return;

  const [transactionKeys, budgetKeys] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      distinct: ["category", "type"],
      select: { category: true, type: true },
    }),
    prisma.budget.findMany({
      where: { userId },
      distinct: ["category"],
      select: { category: true },
    }),
  ]);

  const known = new Set<string>(DEFAULT_CATEGORIES.map((c) => c.value));
  const extra = new Map<string, CategoryKind>();
  for (const t of transactionKeys) {
    if (!known.has(t.category) && !extra.has(t.category)) {
      extra.set(t.category, t.type === "income" ? "income" : "expense");
    }
  }
  for (const b of budgetKeys) {
    if (!known.has(b.category) && !extra.has(b.category)) extra.set(b.category, "expense");
  }

  let customExpenses = 0;
  const rows = [
    ...DEFAULT_CATEGORIES.map((c, position) => ({ userId, ...c, custom: false, position })),
    ...[...extra].map(([value, kind], i) => ({
      userId,
      value,
      label: labelFromValue(value),
      kind,
      ...GENERIC_ICON,
      color: kind === "expense" ? CUSTOM_COLORS[customExpenses++ % CUSTOM_COLORS.length] : "var(--primary)",
      custom: true,
      position: DEFAULT_CATEGORIES.length + i,
    })),
  ];

  try {
    // Two requests can arrive together (React Strict Mode fetches twice in dev). The
    // loser's insert fails as a whole with a unique violation and adds nothing, and the
    // winner's rows are already there, so that error is safe to ignore. (Prisma's
    // `skipDuplicates` isn't available for SQLite.)
    await prisma.category.createMany({ data: rows });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
}