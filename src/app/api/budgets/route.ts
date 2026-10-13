import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/current-user";
import { fromCents, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// Same shape the client uses: { "2026-10": { food: 650, rent: 1200, ... } }
type BudgetsByMonth = Record<string, Record<string, number>>;

// Read-only, so the cheap session check is enough. Changes go through
//   PUT  /api/budgets/[month]/[category]   (one category in one month)
//   POST /api/budgets/merge                (fold one category into another)
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const rows = await prisma.budget.findMany({
    where: { userId },
    orderBy: [{ month: "asc" }, { category: "asc" }],
  });
  const result: BudgetsByMonth = {};
  for (const r of rows) {
    (result[r.month] ??= {})[r.category] = fromCents(r.amountCents);
  }
  return Response.json(result);
}
