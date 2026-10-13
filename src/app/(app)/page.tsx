"use client";

import { useMemo } from "react";
import { CashflowChart } from "@/components/CashflowChart";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ExpenseDonut } from "@/components/ExpenseDonut";
import { RecentTransactions } from "@/components/RecentTransactions";
import { StatCards } from "@/components/StatCards";
import { useTransactions } from "@/lib/transactions-context";
import { usePeriod } from "@/lib/period-context";

export default function DashboardPage() {
  const { transactions, addTransaction } = useTransactions();
  const { periodKey } = usePeriod();

  // Only the selected month, for the donut and the recent list
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(periodKey)),
    [transactions, periodKey]
  );

  return (
    <>
      <DashboardHeader onAddTransaction={addTransaction} />
      <StatCards transactions={transactions} periodKey={periodKey} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <div className="lg:w-2/5">
          <ExpenseDonut transactions={monthTransactions} />
        </div>
        <div className="lg:w-3/5">
          <CashflowChart transactions={transactions} periodKey={periodKey} />
        </div>
      </div>

      <RecentTransactions transactions={monthTransactions} />
    </>
  );
}
