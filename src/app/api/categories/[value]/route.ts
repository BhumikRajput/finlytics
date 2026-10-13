import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import {
  badRequest,
  conflict,
  notFound,
  parseCategory,
  readJson,
  unauthorized,
} from "@/lib/api-helpers";
import { parseCategoryRename, toApiCategory } from "@/lib/categories-api";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ value: string }> };

// Rename one category (defaults included). Transactions only store the key, so every
// past transaction shows the new name right away.
export async function PATCH(req: Request, { params }: RouteParams) {
  const userId = await getCurrentUserId(); // strict
  if (!userId) return unauthorized();

  const key = parseCategory((await params).value, "value");
  if (!key.ok) return badRequest(key.error);

  const parsed = parseCategoryRename(await readJson(req));
  if (!parsed.ok) return badRequest(parsed.error);

  const where = { userId_value: { userId, value: key.value } };
  const existing = await prisma.category.findUnique({ where });
  if (!existing) return notFound("Category not found.");

  const updated = await prisma.category.update({ where, data: { label: parsed.value.label } });
  return Response.json(toApiCategory(updated));
}

// Delete one custom category. Idempotent: deleting something that is already gone is
// still a success.
//
// Transactions and budgets point at a category by key with no foreign key, so this
// refuses (409) while any of them still do. The client moves them first (reassign, then
// budget merge, then this call, all in one ordered queue), which means a failed move
// can never leave transactions pointing at a deleted category.
export async function DELETE(_req: Request, { params }: RouteParams) {
  const userId = await getCurrentUserId(); // strict
  if (!userId) return unauthorized();

  const key = parseCategory((await params).value, "value");
  if (!key.ok) return badRequest(key.error);

  const outcome = await prisma.$transaction(async (tx) => {
    const where = { userId_value: { userId, value: key.value } };
    const row = await tx.category.findUnique({ where });
    if (!row) return "gone" as const;
    if (!row.custom) return "default" as const;

    const transactions = await tx.transaction.count({ where: { userId, category: row.value } });
    const budgets = await tx.budget.count({ where: { userId, category: row.value } });
    if (transactions > 0 || budgets > 0) return "in-use" as const;

    await tx.category.delete({ where });
    return "deleted" as const;
  });

  if (outcome === "default") return badRequest("Default categories can't be deleted.");
  if (outcome === "in-use") {
    return conflict("Move this category's transactions and budget to Others before deleting it.");
  }
  return Response.json({ ok: true, deleted: outcome === "deleted" ? 1 : 0 });
}
