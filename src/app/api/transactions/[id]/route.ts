import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { badRequest, notFound, readJson, toCents, unauthorized } from "@/lib/api-helpers";
import {
  SIGN_ERROR,
  parseId,
  parseTransactionPatch,
  signMatchesType,
  toApiTransaction,
} from "@/lib/transactions-api";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

// Edit one transaction. Only the fields that are sent are changed.
export async function PATCH(req: Request, { params }: RouteParams) {
  const userId = await getCurrentUserId(); // strict
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id.ok) return badRequest(id.error);

  const parsed = parseTransactionPatch(await readJson(req));
  if (!parsed.ok) return badRequest(parsed.error);
  const patch = parsed.value;

  const where = { userId_id: { userId, id: id.value } };
  const existing = await prisma.transaction.findUnique({ where });
  if (!existing) return notFound("Transaction not found.");

  // Type and amount must still agree after the edit, even if only one of them was sent
  const nextType = patch.type ?? existing.type;
  const nextCents = patch.amount !== undefined ? toCents(patch.amount) : existing.amountCents;
  if (!signMatchesType(nextType, nextCents)) return badRequest(SIGN_ERROR);

  const updated = await prisma.transaction.update({
    where,
    data: {
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.note !== undefined && { note: patch.note }),
      ...(patch.date !== undefined && { date: patch.date }),
      ...(patch.amount !== undefined && { amountCents: nextCents }),
      ...(patch.type !== undefined && { type: patch.type }),
      ...(patch.category !== undefined && { category: patch.category }),
    },
  });
  return Response.json(toApiTransaction(updated));
}

// Delete one transaction. Idempotent: deleting something that is already gone is
// still a success, so a retry can never make the UI think the delete failed.
export async function DELETE(_req: Request, { params }: RouteParams) {
  const userId = await getCurrentUserId(); // strict
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id.ok) return badRequest(id.error);

  const { count } = await prisma.transaction.deleteMany({ where: { userId, id: id.value } });
  return Response.json({ ok: true, deleted: count });
}
