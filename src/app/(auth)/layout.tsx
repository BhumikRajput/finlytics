import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet size={19} strokeWidth={2.25} />
          </div>
          <span className="font-display text-[20px] font-semibold tracking-tight text-ink">
            Finlytics
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
