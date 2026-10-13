"use client";

import { ArrowDownRight, ArrowUpRight, Target, Wallet } from "lucide-react";
import { computeStats, formatCurrency, type Transaction } from "@/lib/data";
import { useBudget } from "@/lib/budget-context";

type StatCardsProps = {
  transactions: Transaction[];
  periodKey: string; // "yyyy-mm", the month chosen in the period selector
};

export function StatCards({ transactions, periodKey }: StatCardsProps) {
  // Balance stays all-time; income, expense and budget cards are for the selected month
  const stats = computeStats(transactions);
  const { getTotalBudget } = useBudget();

  const monthTransactions = transactions.filter((t) => t.date.startsWith(periodKey));
  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const spent = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // Total budget = sum of the selected month's category budgets
  const limit = getTotalBudget(periodKey);
  const budgetPct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-faint">Total Balance</span>
          <Wallet size={15} className="text-ink-faint" />
        </div>
        <p className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-ink sm:text-[22px]">
          {formatCurrency(stats.totalBalance)}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-faint">Income</span>
          <ArrowUpRight size={15} className="text-primary" />
        </div>
        <p className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-primary-dark sm:text-[22px]">
          {formatCurrency(monthIncome)}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-faint">Expense</span>
          <ArrowDownRight size={15} className="text-negative" />
        </div>
        <p className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-negative sm:text-[22px]">
          {formatCurrency(spent)}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-faint">Remaining Budget</span>
          <Target size={15} className="text-ink-faint" />
        </div>
        <p className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-ink sm:text-[22px]">
          {formatCurrency(limit - spent)}
          <span className="ml-1 font-sans text-[12.5px] font-normal text-ink-faint">
            / {formatCurrency(limit)}
          </span>
        </p>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className={`h-full rounded-full ${limit > 0 && spent >= limit ? "bg-negative" : "bg-primary"}`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
