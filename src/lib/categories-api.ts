// Validation + serialization for the category endpoints. Server-side only.
import { fail, isPlainObject, ok, parseCategory, type Result } from "./api-helpers";
import { isCategoryIconName } from "./category-icons";
import { CATEGORY_LABEL_MAX, type CategoryKind, type CategoryRecord } from "./default-categories";

export type NewCategory = Omit<CategoryRecord, "custom">;

// These end up in className / style, so only plain Tailwind colour classes, #rrggbb
// and CSS variables are accepted.
const BG_CLASS_RE = /^bg-[a-z]+-\d{2,3}$/;
const TEXT_CLASS_RE = /^text-[a-z]+-\d{2,3}$/;
const COLOR_RE = /^(#[0-9a-fA-F]{6}|var\(--[a-z-]+\))$/;

export function toApiCategory(row: {
  value: string;
  label: string;
  kind: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  color: string;
  custom: boolean;
}): CategoryRecord {
  return {
    value: row.value,
    label: row.label,
    kind: row.kind as CategoryKind,
    iconName: row.iconName,
    iconBg: row.iconBg,
    iconColor: row.iconColor,
    color: row.color,
    custom: row.custom,
  };
}

export function parseLabel(v: unknown): Result<string> {
  if (typeof v !== "string") return fail(`"label" must be a string.`);
  const label = v.trim();
  if (label.length === 0 || label.length > CATEGORY_LABEL_MAX) {
    return fail(`"label" must be 1 to ${CATEGORY_LABEL_MAX} characters.`);
  }
  return ok(label);
}

function parseKind(v: unknown): Result<CategoryKind> {
  if (v !== "expense" && v !== "income") return fail(`"kind" must be "expense" or "income".`);
  return ok(v);
}

// POST body: every field is required. `custom` is never read from the client: a category
// created through the API is always custom (only the defaults are not).
export function parseNewCategory(body: unknown): Result<NewCategory> {
  if (!isPlainObject(body)) return fail("Body must be a JSON object.");

  const value = parseCategory(body.value, "value");
  if (!value.ok) return value;
  const label = parseLabel(body.label);
  if (!label.ok) return label;
  const kind = parseKind(body.kind);
  if (!kind.ok) return kind;

  const { iconName, iconBg, iconColor, color } = body;
  if (!isCategoryIconName(iconName)) return fail(`"iconName" must be one of the known icon names.`);
  if (typeof iconBg !== "string" || !BG_CLASS_RE.test(iconBg)) {
    return fail(`"iconBg" must be a Tailwind class like "bg-orange-100".`);
  }
  if (typeof iconColor !== "string" || !TEXT_CLASS_RE.test(iconColor)) {
    return fail(`"iconColor" must be a Tailwind class like "text-orange-500".`);
  }
  if (typeof color !== "string" || !COLOR_RE.test(color)) {
    return fail(`"color" must be a hex colour like "#7c5cbf" or a CSS variable like "var(--primary)".`);
  }

  return ok({
    value: value.value,
    label: label.value,
    kind: kind.value,
    iconName,
    iconBg,
    iconColor,
    color,
  });
}

// PATCH body: only renaming is supported
export function parseCategoryRename(body: unknown): Result<{ label: string }> {
  if (!isPlainObject(body)) return fail("Body must be a JSON object.");
  const label = parseLabel(body.label);
  if (!label.ok) return label;
  return ok({ label: label.value });
}
