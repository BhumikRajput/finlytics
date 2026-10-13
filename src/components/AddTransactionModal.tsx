"use client";

import { useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { useCategories } from "@/lib/categories-context";
import type { Transaction, TransactionCategory, TransactionType } from "@/lib/data";

type AddTransactionModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transaction?: Transaction | null; // pass an existing transaction to edit it
};

function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function AddTransactionModal({ open, onClose, onSave, transaction }: AddTransactionModalProps) {
  const isEditing = Boolean(transaction);
  const { expenseCategories, incomeCategories } = useCategories();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Reset the form whenever the modal transitions to open (or the target
  // transaction changes) — done during render instead of in an effect so
  // there's no extra committed render with stale field values.
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevTransactionId, setPrevTransactionId] = useState(transaction?.id);

  if (open !== prevOpen || transaction?.id !== prevTransactionId) {
    setPrevOpen(open);
    setPrevTransactionId(transaction?.id);

    if (open) {
      if (transaction) {
        setType(transaction.type);
        setAmount(String(Math.abs(transaction.amount)));
        setCategory(transaction.category);
        setDate(transaction.date);
        setNote(transaction.note);
      } else {
        setType("expense");
        setAmount("");
        setCategory("");
        setDate(todayISO());
        setNote("");
      }
      setCategoryOpen(false);
    }
  }

  if (!open) return null;

  const categoryOptions = type === "expense" ? expenseCategories : incomeCategories;

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategory("");
  };

  const canSave = parseFloat(amount) > 0 && category !== "";

  const handleSave = () => {
    if (!canSave) return;
    const numericAmount = Math.abs(parseFloat(amount));

    onSave({
      id: transaction?.id ?? crypto.randomUUID(),
      name: categoryOptions.find((c) => c.value === category)?.label ?? "Transaction",
      note,
      date,
      amount: type === "income" ? numericAmount : -numericAmount,
      type,
      category: category as TransactionCategory,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-ink/10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[16px] font-semibold text-ink">
            {isEditing ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-canvas hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-ink-muted">Type</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
              <button
                type="button"
                onClick={() => switchType("expense")}
                className={`rounded-md py-1.5 text-[13px] font-medium transition-colors ${type === "expense" ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
                  }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => switchType("income")}
                className={`rounded-md py-1.5 text-[13px] font-medium transition-colors ${type === "income" ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
                  }`}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="text-[13px] font-medium text-ink-muted">
              Amount
            </label>
            <div className="mt-1.5 flex items-center rounded-lg border border-line bg-canvas px-3 py-2">
              <span className="text-[13px] text-ink-faint">$</span>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="ml-1.5 w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[13px] font-medium text-ink-muted">Category</label>
            <button
              type="button"
              onClick={() => setCategoryOpen((v) => !v)}
              onBlur={() => setTimeout(() => setCategoryOpen(false), 120)}
              className="mt-1.5 flex w-full items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2 text-left text-[13.5px]"
            >
              <span className={category ? "text-ink" : "text-ink-faint"}>
                {categoryOptions.find((c) => c.value === category)?.label ?? "Select category"}
              </span>
              <ChevronDown size={14} className="text-ink-faint" />
            </button>
            {categoryOpen && (
              <ul className="absolute z-10 mt-1.5 max-h-44 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg shadow-ink/5">
                {categoryOptions.map((c) => (
                  <li key={c.value}>
                    <button
                      type="button"
                      onMouseDown={() => setCategory(c.value)}
                      className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-canvas ${c.value === category ? "text-primary-dark font-medium" : "text-ink-muted"
                        }`}
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="date" className="text-[13px] font-medium text-ink-muted">
              Date
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
              <Calendar size={15} className="shrink-0 text-ink-faint" />
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-[13.5px] text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="note" className="text-[13px] font-medium text-ink-muted">
              Note <span className="text-ink-faint">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={3}
              maxLength={1000}
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEditing ? "Save Changes" : "Save Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
