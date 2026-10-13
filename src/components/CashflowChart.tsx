"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, type Transaction } from "@/lib/data";
import { useBudget } from "@/lib/budget-context";
import { monthLabel } from "@/lib/period-context";

type DayPoint = {
  day: number;
  income: number | null; // running total, null on future days so the line stops at today
  expense: number | null;
  budget: number | null; // flat line at this month's total budget
};

// Cumulative income and expense for every day of the selected month (local time)
function buildMonthSeries(transactions: Transaction[], budget: number, monthKey: string): DayPoint[] {
  const [year, m] = monthKey.split("-").map(Number);
  const month = m - 1;
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Current month stops at today; past months draw the full month
  const today = isCurrentMonth ? now.getDate() : daysInMonth;

  const incomeByDay = new Array<number>(daysInMonth + 1).fill(0);
  const expenseByDay = new Array<number>(daysInMonth + 1).fill(0);

  for (const t of transactions) {
    if (!t.date.startsWith(monthKey)) continue;
    const day = Number(t.date.slice(8, 10));
    if (t.type === "income") incomeByDay[day] += Math.abs(t.amount);
    else expenseByDay[day] += Math.abs(t.amount);
  }

  let runningIncome = 0;
  let runningExpense = 0;

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    runningIncome += incomeByDay[day];
    runningExpense += expenseByDay[day];
    const isFuture = day > today;
    return {
      day,
      income: isFuture ? null : runningIncome,
      expense: isFuture ? null : runningExpense,
      budget: budget > 0 ? budget : null,
    };
  });
}

function formatAxis(value: number) {
  if (value >= 1000) return `$${Math.round(value / 100) / 10}k`;
  return `$${value}`;
}

const seriesNames: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  budget: "Budget",
};

type CashflowChartProps = {
  transactions: Transaction[];
  periodKey: string; // "yyyy-mm", the month chosen in the period selector
};

export function CashflowChart({ transactions, periodKey }: CashflowChartProps) {
  const { getTotalBudget } = useBudget();
  const budget = getTotalBudget(periodKey);

  const data = useMemo(
    () => buildMonthSeries(transactions, budget, periodKey),
    [transactions, budget, periodKey]
  );
  const monthName = monthLabel(periodKey);

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-ink">
            Income vs Expense vs Budget
          </h2>
          <p className="text-[12px] text-ink-faint">{monthName} · running totals</p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-negative" /> Expense
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" /> Budget
          </span>
        </div>
      </div>

      <div className="mt-3 h-64 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--ink-faint)" }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 12, fill: "var(--ink-faint)" }}
              tickFormatter={formatAxis}
            />
            <Tooltip
              cursor={{ stroke: "var(--line-strong)" }}
              labelFormatter={(label) => `Day ${label}`}
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                seriesNames[String(name)] ?? String(name),
              ]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--line)",
                fontSize: 12.5,
              }}
              wrapperStyle={{ zIndex: 10 }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="var(--primary)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--negative)"
              strokeWidth={2}
              fill="var(--negative)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="linear"
              dataKey="budget"
              stroke="var(--warning)"
              strokeWidth={2}
              strokeDasharray="2 4"
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
