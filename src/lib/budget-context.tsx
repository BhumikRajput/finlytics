"use client";

import { createContext, useContext, type ReactNode } from "react";
import { sendJson } from "./api-client";
import { useRemoteState } from "./use-remote-state";

// key = category value (e.g. "food", "gym-membership"), amount = budget for the month
export type CategoryAmounts = Record<string, number>;

type BudgetsByMonth = Record<string, CategoryAmounts>; // month key = "2026-06"

type BudgetContextValue = {
  // Category budgets for a month (falls back to the latest earlier month)
  getCategoryBudgets: (month: string) => CategoryAmounts;
  // Total = sum of that month's category budgets
  getTotalBudget: (month: string) => number;
  setCategoryBudget: (month: string, category: string, amount: number) => void;
  // Move a deleted category's budget into another category, in every month
  mergeCategoryBudget: (from: string, to: string) => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

// Use the month's own budgets if set, otherwise carry forward the latest earlier month.
// (The server mirrors this in PUT /api/budgets/[month]/[category].)
function resolve(budgets: BudgetsByMonth, month: string): CategoryAmounts {
  if (budgets[month]) return budgets[month];
  const keys = Object.keys(budgets).sort();
  const earlier = keys.filter((k) => k < month).pop();
  if (earlier) return budgets[earlier];
  // No earlier month: fall back to the oldest one that has a budget
  return keys.length ? budgets[keys[0]] : {};
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  // Loaded once from GET /api/budgets; each change is optimistic, then one request,
  // and is undone with an error toast if that request fails.
  const { state: budgets, mutate, getState } = useRemoteState<BudgetsByMonth>("/api/budgets", {});

  const getCategoryBudgets = (month: string) => resolve(budgets, month);

  const getTotalBudget = (month: string) =>
    Object.values(resolve(budgets, month)).reduce((s, v) => s + (v ?? 0), 0);

  const setCategoryBudget = (month: string, category: string, amount: number) => {
    const before = getState()[month]; // undefined = this month was inheriting

    mutate({
      apply: (prev) => ({
        ...prev,
        [month]: { ...resolve(prev, month), [category]: amount },
      }),
      undo: (prev) => {
        const next = { ...prev };
        if (before === undefined) delete next[month];
        else next[month] = before;
        return next;
      },
      request: () =>
        sendJson(
          `/api/budgets/${encodeURIComponent(month)}/${encodeURIComponent(category)}`,
          "PUT",
          { amount },
        ),
      errorMessage: "Couldn't save the budget, so the previous amount was restored.",
    });
  };

  const mergeCategoryBudget = (from: string, to: string) => {
    const before = getState();

    mutate({
      apply: (prev) => {
        const next: BudgetsByMonth = {};
        for (const [month, amounts] of Object.entries(prev)) {
          const { [from]: moved = 0, ...rest } = amounts;
          const merged = moved > 0 ? { ...rest, [to]: (rest[to] ?? 0) + moved } : rest;
          // A month with no categories left has no rows in the database either
          if (Object.keys(merged).length > 0) next[month] = merged;
        }
        return next;
      },
      undo: () => before,
      request: () => sendJson("/api/budgets/merge", "POST", { from, to }),
      errorMessage: "Couldn't merge the category's budget, so it was restored.",
    });
  };

  return (
    <BudgetContext.Provider
      value={{ getCategoryBudgets, getTotalBudget, setCategoryBudget, mergeCategoryBudget }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
