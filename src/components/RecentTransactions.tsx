"use client";

import Link from "next/link";
import { formatCurrency, formatDisplayDate, type Transaction } from "@/lib/data";
import { useCategories } from "@/lib/categories-context";

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const { getIcon, getLabel } = useCategories();

  const sorted = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-ink">Recent Transactions</h2>
        <Link href="/transactions" className="text-[13px] font-medium text-primary hover:text-primary-dark">
          View all
        </Link>
      </div>

      <ul className="mt-2 divide-y divide-line">
        {sorted.map((tx) => {
          const Icon = getIcon(tx.category);
          const positive = tx.amount >= 0;
          return (
            <li key={tx.id} className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas">
                <Icon size={16} className="text-ink-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{getLabel(tx.category)}</p>
                <p className="truncate text-[12px] text-ink-faint">
                  {tx.note || formatDisplayDate(tx.date)}
                </p>
              </div>
              <span
                className={`shrink-0 text-[13.5px] font-medium ${positive ? "text-primary-dark" : "text-negative"
                  }`}
              >
                {positive ? "+" : ""}
                {formatCurrency(tx.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
