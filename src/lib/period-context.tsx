"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useTransactions } from "./transactions-context";

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type PeriodContextValue = {
  periodKey: string; // "yyyy-mm"
  setPeriodKey: (key: string) => void;
  periods: { key: string; label: string }[]; // newest first
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const { transactions } = useTransactions();
  const currentKey = monthKey(new Date());

  const [periodKey, setPeriodKey] = useState(currentKey);

  // Every month from now back to the oldest transaction, newest first
  const periods = useMemo(() => {
    const earliest = transactions.reduce((min, t) => {
      const k = t.date.slice(0, 7);
      return k < min ? k : min;
    }, currentKey);

    const list: { key: string; label: string }[] = [];
    let [y, m] = currentKey.split("-").map(Number);
    for (;;) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      list.push({ key, label: monthLabel(key) });
      if (key <= earliest) break;
      m -= 1;
      if (m === 0) {
        m = 12;
        y -= 1;
      }
    }
    return list;
  }, [transactions, currentKey]);

  return (
    <PeriodContext.Provider value={{ periodKey, setPeriodKey, periods }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
