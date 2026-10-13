// Validation + serialization for the transaction endpoints. Server-side only.
import {
  MAX_AMOUNT,
  ID_MAX,
  fail,
  fromCents,
  isPlainObject,
  isValidDate,
  ok,
  parseCategory,
  type Result,
} from "./api-helpers";

export type ApiTransaction = {
  id: string;
  name: string;
  note: string;
  date: string;
  amount: number; // currency units; income positive, expense negative
  type: "income" | "expense";
  category: string;
};

export type TransactionPatch = Partial<Omit<ApiTransaction, "id">>;

const NAME_MAX = 200;
const NOTE_MAX = 1000;

export function toApiTransaction(row: {
  id: string;
  name: string;
  note: string;
  date: string;
  amountCents: number;
  type: string;
  category: string;
}): ApiTransaction {
  return {
    id: row.id,
    name: row.name,
    note: row.note,
    date: row.date,
    amount: fromCents(row.amountCents),
    type: row.type as "income" | "expense",
    category: row.category,
  };
}

export function parseId(v: unknown): Result<string> {
  if (typeof v !== "string" || v.length === 0 || v.length > ID_MAX) {
    return fail(`"id" must be a non-empty string of at most ${ID_MAX} characters.`);
  }
  return ok(v);
}

function parseName(v: unknown): Result<string> {
  if (typeof v !== "string" || v.trim().length === 0 || v.length > NAME_MAX) {
    return fail(`"name" must be a non-empty string of at most ${NAME_MAX} characters.`);
  }
  return ok(v.trim());
}

function parseNote(v: unknown): Result<string> {
  if (typeof v !== "string" || v.length > NOTE_MAX) {
    return fail(`"note" must be a string of at most ${NOTE_MAX} characters.`);
  }
  return ok(v);
}

function parseDate(v: unknown): Result<string> {
  if (typeof v !== "string" || !isValidDate(v)) return fail(`"date" must be a real date like 2026-10-12.`);
  return ok(v);
}

function parseAmount(v: unknown): Result<number> {
  if (typeof v !== "number" || !Number.isFinite(v) || v === 0 || Math.abs(v) > MAX_AMOUNT) {
    return fail(`"amount" must be a non-zero number (absolute value up to ${MAX_AMOUNT}).`);
  }
  return ok(v);
}

function parseType(v: unknown): Result<"income" | "expense"> {
  if (v !== "income" && v !== "expense") return fail(`"type" must be "income" or "expense".`);
  return ok(v);
}

// Income is stored positive, expense negative (see schema.prisma)
export const signMatchesType = (type: string, amountCents: number) =>
  type === "income" ? amountCents > 0 : amountCents < 0;

export const SIGN_ERROR = "Income amounts must be positive and expense amounts negative.";

// POST body: every field is required, except note (defaults to "")
export function parseNewTransaction(body: unknown): Result<ApiTransaction> {
  if (!isPlainObject(body)) return fail("Body must be a JSON object.");

  const id = parseId(body.id);
  if (!id.ok) return id;
  const name = parseName(body.name);
  if (!name.ok) return name;
  const note = body.note === undefined ? ok("") : parseNote(body.note);
  if (!note.ok) return note;
  const date = parseDate(body.date);
  if (!date.ok) return date;
  const amount = parseAmount(body.amount);
  if (!amount.ok) return amount;
  const type = parseType(body.type);
  if (!type.ok) return type;
  const category = parseCategory(body.category);
  if (!category.ok) return category;

  return ok({
    id: id.value,
    name: name.value,
    note: note.value,
    date: date.value,
    amount: amount.value,
    type: type.value,
    category: category.value,
  });
}

// PATCH body: any subset of the editable fields (at least one)
export function parseTransactionPatch(body: unknown): Result<TransactionPatch> {
  if (!isPlainObject(body)) return fail("Body must be a JSON object.");

  const patch: TransactionPatch = {};

  if (body.name !== undefined) {
    const r = parseName(body.name);
    if (!r.ok) return r;
    patch.name = r.value;
  }
  if (body.note !== undefined) {
    const r = parseNote(body.note);
    if (!r.ok) return r;
    patch.note = r.value;
  }
  if (body.date !== undefined) {
    const r = parseDate(body.date);
    if (!r.ok) return r;
    patch.date = r.value;
  }
  if (body.amount !== undefined) {
    const r = parseAmount(body.amount);
    if (!r.ok) return r;
    patch.amount = r.value;
  }
  if (body.type !== undefined) {
    const r = parseType(body.type);
    if (!r.ok) return r;
    patch.type = r.value;
  }
  if (body.category !== undefined) {
    const r = parseCategory(body.category);
    if (!r.ok) return r;
    patch.category = r.value;
  }

  if (Object.keys(patch).length === 0) return fail("Nothing to update.");
  return ok(patch);
}
