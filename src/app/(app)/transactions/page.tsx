"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { PeriodSelector } from "@/components/PeriodSelector";
import { useTransactions } from "@/lib/transactions-context";
import { useCategories } from "@/lib/categories-context";
import { usePeriod } from "@/lib/period-context";
import {
  formatCurrency,
  formatDisplayDate,
  type Transaction,
  type TransactionType,
} from "@/lib/data";

const PAGE_SIZE = 7;

const PAGE_WINDOW = 5;

function pageWindow(current: number, total: number): number[] {
  const size = Math.min(total, PAGE_WINDOW);
  const start = Math.min(Math.max(1, current - Math.floor(size / 2)), total - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}

type TypeFilter = "all" | TransactionType;

const typeFilterLabels: Record<TypeFilter, string> = {
  all: "All Types",
  expense: "Expense",
  income: "Income",
};

export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { getLabel } = useCategories();
  const { periodKey } = usePeriod();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const [typeOpen, setTypeOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Go back to page 1 whenever the month changes
  const [prevPeriod, setPrevPeriod] = useState(periodKey);
  if (prevPeriod !== periodKey) {
    setPrevPeriod(periodKey);
    setPage(1);
  }

  const hasActiveFilters = search !== "" || typeFilter !== "all";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions
      .filter((t) => t.date.startsWith(periodKey))
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) => {
        if (!query) return true;
        return t.note.toLowerCase().includes(query) || getLabel(t.category).toLowerCase().includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, typeFilter, periodKey, getLabel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPage(1);
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setModalOpen(true);
  };

  const handleSave = (t: Transaction) => {
    if (editingTransaction) updateTransaction(t);
    else addTransaction(t);
    setEditingTransaction(null);
  };

  const confirmDelete = () => {
    if (deletingTransaction) {
      deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
    }
  };

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Transactions</h1>
        <div className="flex items-center gap-2.5">
          <PeriodSelector />
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark sm:px-4"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:items-center sm:p-4">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by note or category"
            className="w-full rounded-lg border border-line bg-canvas py-2 pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeOpen((v) => !v)}
              onBlur={() => setTimeout(() => setTypeOpen(false), 120)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] font-medium text-ink-muted"
            >
              {typeFilterLabels[typeFilter]}
              <ChevronDown size={14} />
            </button>
            {typeOpen && (
              <ul className="absolute right-0 z-10 mt-1.5 w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg shadow-ink/5 sm:left-0">
                {(Object.keys(typeFilterLabels) as TypeFilter[]).map((val) => (
                  <li key={val}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setTypeFilter(val);
                        setPage(1);
                      }}
                      className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-canvas ${val === typeFilter ? "text-primary-dark font-medium" : "text-ink-muted"
                        }`}
                    >
                      {typeFilterLabels[val]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2 text-[13px] font-medium text-ink-faint hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left">
            <thead>
              <tr className="border-b border-line text-[12.5px] text-ink-faint">
                <th className="px-4 py-3 font-medium sm:px-5">Date</th>
                <th className="px-4 py-3 font-medium sm:px-5">Category</th>
                <th className="px-4 py-3 font-medium sm:px-5">Note</th>
                <th className="px-4 py-3 font-medium sm:px-5">Type</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">Amount</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((t) => (
                <tr key={t.id} className="text-[13.5px] text-ink">
                  <td className="whitespace-nowrap px-4 py-3 sm:px-5">{formatDisplayDate(t.date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-5">{getLabel(t.category)}</td>
                  <td className="max-w-45 truncate px-4 py-3 text-ink-muted sm:px-5">{t.note || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[12px] font-medium ${t.type === "income" ? "bg-primary-soft text-primary-dark" : "bg-negative-soft text-negative"
                        }`}
                    >
                      {typeFilterLabels[t.type]}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium sm:px-5 ${t.amount >= 0 ? "text-primary-dark" : "text-negative"
                      }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        aria-label="Edit transaction"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-canvas hover:text-ink"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTransaction(t)}
                        aria-label="Delete transaction"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-negative-soft hover:text-negative"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-ink-faint sm:px-5">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row sm:px-5">
          <span className="text-[12.5px] text-ink-faint">
            Showing {rangeStart}-{rangeEnd} of {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {pageWindow(currentPage, totalPages).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[12.5px] font-medium ${p === currentPage ? "bg-primary text-white" : "text-ink-muted hover:bg-canvas"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSave}
        transaction={editingTransaction}
      />

      {deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-ink/10">
            <h2 className="font-display text-[16px] font-semibold text-ink">Delete transaction?</h2>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              This will permanently remove &ldquo;
              {deletingTransaction.note || getLabel(deletingTransaction.category)}&rdquo; from your transactions.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-negative px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
