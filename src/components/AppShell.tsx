"use client";

import type { ReactNode } from "react";
import type { CurrentUser } from "@/lib/user";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "./SidebarContext";

function ShellBody({ children, user }: { children: ReactNode; user: CurrentUser }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar user={user} />

      <main
        className={`pb-20 transition-[margin] duration-200 ease-in-out lg:pb-8 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export function AppShell({ children, user }: { children: ReactNode; user: CurrentUser }) {
  return <ShellBody user={user}>{children}</ShellBody>;
}
