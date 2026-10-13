import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { badRequest, isPlainObject, parseCategory, readJson, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// Fold one category's budget into another, in every month (used when a category is
// deleted). Months where the deleted category had a budget > 0 add that amount to the
// target; the deleted category's rows are removed. All in one transaction.
export async function POST(req: Request) {
  const userId = await getCurrentUserId(); // strict
  if (!userId) return unauthorized();

  const body = await readJson(req);
  if (!isPlainObject(body)) return badRequest("Body must be a JSON object.");

  const from = parseCategory(body.from, "from");
  if (!from.ok) return badRequest(from.error);
  const to = parseCategory(body.to, "to");
  if (!to.ok) return badRequest(to.error);
  if (from.value === to.value) return badRequest(`"from" and "to" must be different categories.`);

  const merged = await prisma.$transaction(async (tx) => {
    const rows = await tx.budget.findMany({ where: { userId, category: from.value } });

    for (const r of rows) {
      await tx.budget.delete({
        where: { userId_month_category: { userId, month: r.month, category: from.value } },
      });

      if (r.amountCents > 0) {
        await tx.budget.upsert({
          where: { userId_month_category: { userId, month: r.month, category: to.value } },
          update: { amountCents: { increment: r.amountCents } },
          create: { userId, month: r.month, category: to.value, amountCents: r.amountCents },
        });
      }
    }
    return rows.length;
  });

  return Response.json({ ok: true, months: merged });
}
