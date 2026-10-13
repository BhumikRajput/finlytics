// Categories are managed in categories-context.tsx (shared by all pages),
// so category keys are plain strings such as "food" or "gym-membership".
export type TransactionCategory = string;

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  name: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // positive = income, negative = expense
  type: TransactionType;
  category: TransactionCategory;
};

export type ExpenseSlice = {
  label: string;
  value: number;
  color: string;
};

// Transactions are loaded from the database through /api/transactions
// (see transactions-context.tsx). Regenerate mock data with `npm run seed`.

export function formatCurrency(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function computeStats(transactions: Transaction[]) {
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return {
    totalBalance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
  };
}

export function computeExpenseBreakdown(
  transactions: Transaction[],
  categories: { value: string; label: string; color: string }[]
): ExpenseSlice[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  if (totalExpense === 0) return [];

  const totals = new Map<string, number>();
  for (const t of expenses) {
    totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount));
  }

  return categories
    .map((c) => ({
      label: c.label,
      value: Math.round(((totals.get(c.value) ?? 0) / totalExpense) * 100),
      color: c.color,
    }))
    .filter((s) => s.value > 0);
}
