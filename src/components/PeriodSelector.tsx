"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePeriod, monthLabel } from "@/lib/period-context";

export function PeriodSelector() {
  const { periodKey, setPeriodKey, periods } = usePeriod();
  const [open, setOpen] = useState(false);
  const label = periods.find((p) => p.key === periodKey)?.label ?? monthLabel(periodKey);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink-muted hover:border-line-strong"
      >
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <ul className="absolute right-0 z-10 mt-1.5 max-h-56 w-44 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg shadow-ink/5">
          {periods.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onMouseDown={() => setPeriodKey(p.key)}
                className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-canvas ${
                  p.key === periodKey ? "text-primary-dark font-medium" : "text-ink-muted"
                }`}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
