"use client";

import { useState } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useBudget } from "@/lib/budget-context";
import { useCategories } from "@/lib/categories-context";
import { useTransactions } from "@/lib/transactions-context";
import { usePeriod, monthLabel } from "@/lib/period-context";
import { PeriodSelector } from "@/components/PeriodSelector";

export default function BudgetPage() {
  const { getCategoryBudgets, getTotalBudget, setCategoryBudget } = useBudget();
  const { expenseCategories } = useCategories();
  const { transactions } = useTransactions();
  const { periodKey } = usePeriod();

  const periodLabel = monthLabel(periodKey);

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // Cancel any open edit when the month changes, so it can't be saved into the wrong month
  const [prevPeriod, setPrevPeriod] = useState(periodKey);
  if (prevPeriod !== periodKey) {
    setPrevPeriod(periodKey);
    setEditingCat(null);
  }

  const categoryBudgets = getCategoryBudgets(periodKey);
  const limit = getTotalBudget(periodKey);

  // Real spending for the selected month, taken from transactions
  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(periodKey)
  );
  const totalSpent = monthExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);

  // One row per expense category, including any added on the Categories page
  const rows = expenseCategories.map((c) => ({
    value: c.value,
    label: c.label,
    spent: monthExpenses
      .filter((t) => t.category === c.value)
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    budget: categoryBudgets[c.value] ?? 0,
  }));

  const remaining = limit - totalSpent;
  const pct = limit > 0 ? Math.min(100, Math.round((totalSpent / limit) * 100)) : 0;
  const overLimit = limit > 0 && totalSpent >= limit;
  const nearLimit = !overLimit && pct >= 80;
  const overCategories = rows.filter((r) => r.budget > 0 && r.spent > r.budget);

  const startEdit = (cat: string, current: number) => {
    setEditingCat(cat);
    setDraft(current > 0 ? String(current) : "");
  };

  const commitEdit = () => {
    if (editingCat) {
      const parsed = parseFloat(draft);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        setCategoryBudget(periodKey, editingCat, parsed);
      }
    }
    setEditingCat(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Budget</h1>
        <PeriodSelector />
      </header>

      {/* Overview: total is the sum of the category budgets */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <span className="text-[12.5px] text-ink-faint">Total Budget</span>
        <p className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-ink">
          {formatCurrency(limit)}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-faint">
          for {periodLabel} · sum of your category budgets
        </p>

        <div className="mt-4 flex items-center justify-between text-[13px]">
          <span className="text-ink-muted">
            Spent {formatCurrency(totalSpent)} of {formatCurrency(limit)}
          </span>
          <span className="font-medium text-ink">Remaining {formatCurrency(remaining)}</span>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className={`h-full rounded-full ${
              overLimit ? "bg-negative" : nearLimit ? "bg-warning" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {(nearLimit || overLimit) && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] ${
              overLimit ? "bg-negative-soft text-negative" : "bg-warning-soft text-warning"
            }`}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              {overLimit
                ? `You've gone over your total budget by ${formatCurrency(Math.abs(remaining))}.`
                : `You're close to your total budget. Only ${formatCurrency(remaining)} left this month.`}
            </span>
          </div>
        )}

        {overCategories.length > 0 && (
          <p className="mt-3 text-[12.5px] text-negative">
            Over budget in: {overCategories.map((c) => c.label).join(", ")}
          </p>
        )}
      </div>

      {/* Budget by category */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-[15px] font-semibold text-ink">Budget by Category</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-faint">
          Click the pencil to set how much you can spend in each category this month. Add new
          categories on the Categories page.
        </p>

        <ul className="mt-4 space-y-4">
          {rows.map((c) => {
            const catPct = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
            const catOver = c.budget > 0 && c.spent > c.budget;
            const isEditing = editingCat === c.value;
            return (
              <li key={c.value}>
                <div className="flex items-center justify-between gap-3 text-[13.5px]">
                  <span className="font-medium text-ink">{c.label}</span>

                  <div className="flex items-center gap-1.5 text-ink-faint">
                    <span>{formatCurrency(c.spent)} of</span>
                    {isEditing ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft}
                        placeholder="0.00"
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditingCat(null);
                        }}
                        aria-label={`${c.label} budget`}
                        className="w-24 rounded-md border border-line bg-canvas px-2 py-0.5 text-right text-[13.5px] text-ink outline-none"
                      />
                    ) : (
                      <span className={c.budget > 0 ? "text-ink-faint" : "italic"}>
                        {c.budget > 0 ? formatCurrency(c.budget) : "not set"}
                      </span>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => (isEditing ? commitEdit() : startEdit(c.value, c.budget))}
                      aria-label={`Edit ${c.label} budget`}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-canvas hover:text-ink"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`h-full rounded-full ${catOver ? "bg-negative" : "bg-primary"}`}
                    style={{ width: `${catPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
