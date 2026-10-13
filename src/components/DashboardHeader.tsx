"use client";

import { Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { AddTransactionModal } from "./AddTransactionModal";
import { PeriodSelector } from "./PeriodSelector";
import type { Transaction } from "@/lib/data";

type DashboardHeaderProps = {
  onAddTransaction: (transaction: Transaction) => void;
};

export function DashboardHeader({ onAddTransaction }: DashboardHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
          <Wallet size={14} strokeWidth={2.25} />
        </div>
        <span className="font-display text-[15px] font-semibold text-ink">Finlytics</span>
      </div>
      <h1 className="hidden font-display text-[22px] font-semibold tracking-tight text-ink lg:block">
        Dashboard
      </h1>

      <div className="flex items-center gap-2.5">
        <PeriodSelector />

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark sm:px-4"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Add Transaction</span>
        </button>
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onAddTransaction}
      />
    </header>
  );
}
