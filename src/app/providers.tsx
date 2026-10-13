"use client";

// Mounted only under src/app/(app)/ so transactions, budgets, and categories
// never linger in the client after sign-out.

import type { ReactNode } from "react";
import { ToastProvider } from "@/lib/toast-context";
import { TransactionsProvider } from "@/lib/transactions-context";
import { PeriodProvider } from "@/lib/period-context";
import { CategoriesProvider } from "@/lib/categories-context";
import { BudgetProvider } from "@/lib/budget-context";
import { SidebarProvider } from "@/components/SidebarContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // Toasts come first so the data providers below can report failed saves
    <ToastProvider>
      <TransactionsProvider>
        <PeriodProvider>
          <CategoriesProvider>
            <BudgetProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </BudgetProvider>
          </CategoriesProvider>
        </PeriodProvider>
      </TransactionsProvider>
    </ToastProvider>
  );
}
