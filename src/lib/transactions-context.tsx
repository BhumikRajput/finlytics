"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Transaction } from "./data";
import { sendDelete, sendJson } from "./api-client";
import { useRemoteState } from "./use-remote-state";

type TransactionsContextValue = {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  reassignCategory: (from: string, to: string, fromLabel: string) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  // Loaded once from GET /api/transactions. Every change below updates the screen
  // immediately, then sends one small request; if it fails the change is undone and
  // an error toast appears (see use-remote-state.ts).
  const { state: transactions, mutate, getState } = useRemoteState<Transaction[]>(
    "/api/transactions",
    [],
  );

  const addTransaction = (t: Transaction) =>
    mutate({
      apply: (prev) => [t, ...prev],
      undo: (prev) => prev.filter((x) => x.id !== t.id),
      request: () => sendJson("/api/transactions", "POST", t),
      errorMessage: "Couldn't save the new transaction, so it was removed.",
    });

  const updateTransaction = (t: Transaction) => {
    const before = getState().find((x) => x.id === t.id);
    if (!before) return;

    mutate({
      apply: (prev) => prev.map((x) => (x.id === t.id ? t : x)),
      undo: (prev) => prev.map((x) => (x.id === t.id ? before : x)),
      request: () =>
        sendJson(`/api/transactions/${encodeURIComponent(t.id)}`, "PATCH", {
          name: t.name,
          note: t.note,
          date: t.date,
          amount: t.amount,
          type: t.type,
          category: t.category,
        }),
      errorMessage: "Couldn't save your changes, so the transaction was restored.",
    });
  };

  const deleteTransaction = (id: string) => {
    const current = getState();
    const index = current.findIndex((x) => x.id === id);
    if (index === -1) return;
    const removed = current[index];

    mutate({
      apply: (prev) => prev.filter((x) => x.id !== id),
      // Put it back where it was
      undo: (prev) => {
        if (prev.some((x) => x.id === id)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      },
      request: () => sendDelete(`/api/transactions/${encodeURIComponent(id)}`),
      errorMessage: "Couldn't delete the transaction, so it was restored.",
    });
  };

  // Move every transaction from one category to another and leave a note.
  // One request: the server does it with a single UPDATE.
  const reassignCategory = (from: string, to: string, fromLabel: string) => {
    const affected = new Map(
      getState()
        .filter((t) => t.category === from)
        .map((t) => [t.id, t]),
    );
    if (affected.size === 0) return;

    mutate({
      apply: (prev) =>
        prev.map((t) =>
          t.category !== from
            ? t
            : {
                ...t,
                category: to,
                note: t.note ? `${t.note} (Moved from ${fromLabel})` : `(Moved from ${fromLabel})`,
              },
        ),
      undo: (prev) => prev.map((t) => affected.get(t.id) ?? t),
      request: () => sendJson("/api/transactions/reassign", "POST", { from, to, fromLabel }),
      errorMessage: "Couldn't move the transactions to the new category, so they were restored.",
    });
  };

  return (
    <TransactionsContext.Provider
      value={{ transactions, addTransaction, updateTransaction, deleteTransaction, reassignCategory }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
