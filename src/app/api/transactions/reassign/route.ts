import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { badRequest, isPlainObject, parseCategory, readJson, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const LABEL_MAX = 200;

// Move every transaction from one category to another (used when a category is deleted)
// and append "(Moved from <label>)" to each note.
//
// One SQL UPDATE does it all. Prisma's updateMany can only set a column to the same
// value for every row, so it can't append to each row's existing note; a single
// parameterized UPDATE can, and it is just as atomic.
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

  const label = typeof body.fromLabel === "string" ? body.fromLabel.trim() : "";
  if (label.length === 0 || label.length > LABEL_MAX) {
    return badRequest(`"fromLabel" must be a non-empty string of at most ${LABEL_MAX} characters.`);
  }

  const suffix = `(Moved from ${label})`;

  const updated = await prisma.$executeRaw`
    UPDATE "Transaction"
    SET "category" = ${to.value},
        "note" = CASE WHEN "note" = '' THEN ${suffix} ELSE "note" || ' ' || ${suffix} END
    WHERE "userId" = ${userId} AND "category" = ${from.value}
  `;

  return Response.json({ ok: true, updated });
}
