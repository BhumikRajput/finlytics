import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import {
  MAX_AMOUNT,
  MONTH_RE,
  badRequest,
  isPlainObject,
  parseCategory,
  readJson,
  toCents,
  unauthorized,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ month: string; category: string }> };

// Set one category's budget for one month.
//
// A month with no rows "inherits" the latest earlier month (or, if there is none, the
// oldest month). The first edit of such a month must therefore copy those inherited
// rows into it first, exactly like the client does, or the month's other categories
// would suddenly become "not set".
export async function PUT(req: Request, { params }: RouteParams) {
  const userId = await getCurrentUserId(); // strict
  if (!userId) return unauthorized();

  const { month, category: rawCategory } = await params;
  if (!MONTH_RE.test(month)) return badRequest(`"month" must look like 2026-10.`);
  const category = parseCategory(rawCategory);
  if (!category.ok) return badRequest(category.error);

  const body = await readJson(req);
  if (!isPlainObject(body)) return badRequest("Body must be a JSON object.");
  const amount = body.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
    return badRequest(`"amount" must be a number between 0 and ${MAX_AMOUNT}.`);
  }
  const amountCents = toCents(amount);

  await prisma.$transaction(async (tx) => {
    const hasRows = (await tx.budget.count({ where: { userId, month } })) > 0;

    if (!hasRows) {
      const earlier = await tx.budget.findFirst({
        where: { userId, month: { lt: month } },
        orderBy: { month: "desc" },
        select: { month: true },
      });
      const source =
        earlier?.month ??
        (
          await tx.budget.findFirst({
            where: { userId },
            orderBy: { month: "asc" },
            select: { month: true },
          })
        )?.month;

      if (source) {
        const inherited = await tx.budget.findMany({ where: { userId, month: source } });
        if (inherited.length > 0) {
          await tx.budget.createMany({
            data: inherited.map((r) => ({
              userId,
              month,
              category: r.category,
              amountCents: r.amountCents,
            })),
          });
        }
      }
    }

    await tx.budget.upsert({
      where: { userId_month_category: { userId, month, category: category.value } },
      update: { amountCents },
      create: { userId, month, category: category.value, amountCents },
    });
  });

  return Response.json({ ok: true });
}
