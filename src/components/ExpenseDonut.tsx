"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { computeExpenseBreakdown, type Transaction } from "@/lib/data";
import { useCategories } from "@/lib/categories-context";

export function ExpenseDonut({ transactions }: { transactions: Transaction[] }) {
  const { expenseCategories } = useCategories();
  const expenseBreakdown = computeExpenseBreakdown(transactions, expenseCategories);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-[15px] font-semibold text-ink">Expense Breakdown</h2>

      {expenseBreakdown.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[13px] text-ink-faint">
          No expenses yet
        </div>
      ) : (
        <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <div className="h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="98%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {expenseBreakdown.map((slice) => (
                    <Cell key={slice.label} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    fontSize: 12.5,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 sm:flex-1">
            {expenseBreakdown.map((slice) => (
              <li key={slice.label} className="flex items-center gap-2 text-[13px] text-ink-muted">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate">
                  {slice.label} <span className="text-ink-faint">({slice.value}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
