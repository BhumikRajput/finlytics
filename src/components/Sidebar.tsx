"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut, Wallet } from "lucide-react";
import { navItems } from "@/lib/nav";
import { getInitials, type CurrentUser } from "@/lib/user";
import { signOutAction } from "@/lib/auth-actions";
import { useSidebar } from "./SidebarContext";

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 border-r border-line bg-surface transition-[width] duration-200 ease-in-out ${
        collapsed ? "lg:w-20" : "lg:w-64"
      }`}
    >
      {/* Collapse / expand toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-faint shadow-sm hover:text-ink hover:border-line-strong"
      >
        {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
      </button>

      <div
        className={`flex items-center h-20 shrink-0 ${
          collapsed ? "justify-center px-2" : "gap-2.5 px-6"
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Wallet size={17} strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <span className="font-display text-[17px] font-semibold tracking-tight text-ink whitespace-nowrap">
            Finlytics
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center rounded-lg text-[14px] font-medium transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                active
                  ? "bg-primary-soft text-primary-dark"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon
                size={18}
                strokeWidth={2}
                className={`shrink-0 ${
                  active ? "text-primary" : "text-ink-faint group-hover:text-ink-muted"
                }`}
              />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}

              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] font-medium text-canvas opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-20">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={`mb-4 flex items-center rounded-xl border border-line ${
          collapsed ? "mx-2 justify-center px-2 py-2.5" : "mx-3 gap-3 px-3 py-2.5"
        }`}
        title={collapsed ? `${user.name} · ${user.email}` : undefined}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/90 text-[13px] font-semibold text-white">
          {getInitials(user.name)}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-ink-faint">{user.email}</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Log out"
                title="Log out"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-faint hover:bg-negative-soft hover:text-negative"
              >
                <LogOut size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}
