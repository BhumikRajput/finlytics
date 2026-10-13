"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { sendDelete, sendJson } from "./api-client";
import { getCategoryIcon, type CategoryIconName } from "./category-icons";
import {
  CUSTOM_COLORS,
  labelFromValue,
  type CategoryKind,
  type CategoryRecord,
} from "./default-categories";
import { useRemoteState } from "./use-remote-state";

export type { CategoryKind };

// What the app works with: the record from the API plus the icon component that its
// iconName maps to.
export type Category = CategoryRecord & { icon: LucideIcon };

export type NewCategoryInput = {
  label: string;
  kind: CategoryKind;
  iconName: CategoryIconName;
  iconBg: string;
  iconColor: string;
};

type CategoriesContextValue = {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  addCategory: (input: NewCategoryInput) => void;
  renameCategory: (value: string, label: string) => void;
  // Only removes the category itself. The caller moves its transactions and budget first
  // (see confirmDelete in categories/page.tsx); the server refuses otherwise.
  deleteCategory: (value: string) => void;
  getLabel: (value: string) => string;
  getIcon: (value: string) => LucideIcon;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

// Keep in sync with CATEGORY_RE in api-helpers.ts (/^[a-z0-9][a-z0-9-]{0,63}$/): the result
// must always match it. The slug is cut to 48 characters so that the "-2", "-3" ... suffix
// added below for duplicates still fits in 64.
function slugify(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");
  return slug || "category";
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  // Loaded once from GET /api/categories (which creates a new user's defaults). Every
  // change updates the screen immediately, then sends one request; if it fails the change
  // is undone and an error toast appears (see use-remote-state.ts).
  const { state: records, mutate, getState } = useRemoteState<CategoryRecord[]>("/api/categories", []);

  const categories = useMemo<Category[]>(
    () => records.map((r) => ({ ...r, icon: getCategoryIcon(r.iconName) })),
    [records],
  );
  const expenseCategories = useMemo(() => categories.filter((c) => c.kind === "expense"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((c) => c.kind === "income"), [categories]);

  const addCategory = (input: NewCategoryInput) => {
    const current = getState();

    // Make the stable key unique among this user's categories
    const base = slugify(input.label);
    let value = base;
    let n = 2;
    while (current.some((c) => c.value === value)) value = `${base}-${n++}`;

    const customExpenses = current.filter((c) => c.custom && c.kind === "expense").length;
    const color =
      input.kind === "expense" ? CUSTOM_COLORS[customExpenses % CUSTOM_COLORS.length] : "var(--primary)";

    const body = {
      value,
      label: input.label.trim(),
      kind: input.kind,
      iconName: input.iconName,
      iconBg: input.iconBg,
      iconColor: input.iconColor,
      color,
    };

    mutate({
      apply: (prev) => [...prev, { ...body, custom: true }],
      undo: (prev) => prev.filter((c) => c.value !== value),
      request: () => sendJson("/api/categories", "POST", body),
      errorMessage: "Couldn't save the new category, so it was removed.",
    });
  };

  const renameCategory = (value: string, label: string) => {
    const before = getState().find((c) => c.value === value);
    const next = label.trim();
    if (!before || !next || next === before.label) return;

    mutate({
      apply: (prev) => prev.map((c) => (c.value === value ? { ...c, label: next } : c)),
      undo: (prev) => prev.map((c) => (c.value === value ? { ...c, label: before.label } : c)),
      request: () =>
        sendJson(`/api/categories/${encodeURIComponent(value)}`, "PATCH", { label: next }),
      errorMessage: "Couldn't rename the category, so the old name was restored.",
    });
  };

  const deleteCategory = (value: string) => {
    const current = getState();
    const index = current.findIndex((c) => c.value === value);
    if (index === -1) return;
    const removed = current[index];
    if (!removed.custom) return; // defaults can't be deleted (the server refuses too)

    mutate({
      apply: (prev) => prev.filter((c) => c.value !== value),
      // Put it back where it was
      undo: (prev) => {
        if (prev.some((c) => c.value === value)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      },
      request: () => sendDelete(`/api/categories/${encodeURIComponent(value)}`),
      errorMessage: "Couldn't delete the category, so it was restored.",
    });
  };

  // Until categories have loaded (or for a key with no category) show a readable name
  // made from the key instead of the raw key
  const getLabel = (value: string) =>
    categories.find((c) => c.value === value)?.label ?? labelFromValue(value);
  const getIcon = (value: string) =>
    categories.find((c) => c.value === value)?.icon ?? getCategoryIcon("");

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        expenseCategories,
        incomeCategories,
        addCategory,
        renameCategory,
        deleteCategory,
        getLabel,
        getIcon,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
