// Pure data and helpers shared by the client, the API and the seed. No React, no Prisma,
// and only a type import from category-icons, so the seed can import it cheaply.
import type { CategoryIconName } from "./category-icons";

export type CategoryKind = "expense" | "income";

// A category as the API sends and receives it (no icon component: the icon is a name)
export type CategoryRecord = {
  value: string; // stable key stored on transactions and budgets, e.g. "food"
  label: string; // display name, can be renamed
  kind: CategoryKind;
  iconName: string; // key of CATEGORY_ICONS
  iconBg: string;
  iconColor: string;
  color: string; // chart colour (used by the expense donut)
  custom: boolean; // false = default: can be renamed, cannot be deleted
};

export type CategoryDef = Omit<CategoryRecord, "iconName" | "custom"> & {
  iconName: CategoryIconName;
};

export const CATEGORY_LABEL_MAX = 60;

// Where a deleted category's transactions and budget go
export const FALLBACK_CATEGORY: Record<CategoryKind, string> = {
  expense: "others",
  income: "other",
};

export const CUSTOM_COLORS = ["#7c5cbf", "#2b8fb3", "#c2547a", "#6b8e23", "#b5651d", "#4a6fa5"];

// Neutral look for categories that have to be created without the user choosing one
export const GENERIC_ICON = {
  iconName: "MoreHorizontal",
  iconBg: "bg-slate-100",
  iconColor: "text-slate-500",
} as const;

// Created for every user the first time their categories are loaded.
// "gym-membership" and "side-hustle" used to be hardcoded here as custom categories.
// They are not defaults any more: a new user starts without them, and the demo user gets
// them from prisma/seed.ts.
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { value: "food", label: "Food", kind: "expense", iconName: "UtensilsCrossed", iconBg: "bg-orange-100", iconColor: "text-orange-500", color: "var(--chart-food)" },
  { value: "travel", label: "Travel", kind: "expense", iconName: "Plane", iconBg: "bg-sky-100", iconColor: "text-sky-500", color: "var(--chart-travel)" },
  { value: "rent", label: "Rent", kind: "expense", iconName: "Home", iconBg: "bg-blue-100", iconColor: "text-blue-500", color: "var(--chart-rent)" },
  { value: "shopping", label: "Shopping", kind: "expense", iconName: "ShoppingBag", iconBg: "bg-amber-100", iconColor: "text-amber-500", color: "var(--chart-shopping)" },
  { value: "entertainment", label: "Entertainment", kind: "expense", iconName: "Clapperboard", iconBg: "bg-orange-100", iconColor: "text-amber-600", color: "var(--chart-entertainment)" },
  { value: "bills", label: "Bills", kind: "expense", iconName: "Receipt", iconBg: "bg-rose-100", iconColor: "text-rose-500", color: "var(--chart-bills)" },
  { value: "others", label: "Others", kind: "expense", iconName: "MoreHorizontal", iconBg: "bg-teal-100", iconColor: "text-teal-500", color: "#2a9d8f" },

  { value: "salary", label: "Salary", kind: "income", iconName: "Banknote", iconBg: "bg-green-100", iconColor: "text-green-600", color: "var(--primary)" },
  { value: "freelance", label: "Freelance", kind: "income", iconName: "Briefcase", iconBg: "bg-sky-100", iconColor: "text-sky-500", color: "var(--primary)" },
  { value: "investment", label: "Investment", kind: "income", iconName: "TrendingUp", iconBg: "bg-amber-100", iconColor: "text-amber-500", color: "var(--primary)" },
  { value: "other", label: "Others", kind: "income", iconName: "MoreHorizontal", iconBg: "bg-slate-100", iconColor: "text-slate-500", color: "var(--primary)" },
];

// "gym-membership" -> "Gym Membership". Used when a label is unknown (for example while
// categories are still loading, or for a key that has no category row).
export function labelFromValue(value: string): string {
  const words = value.split("-").filter(Boolean);
  if (words.length === 0) return value;
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
