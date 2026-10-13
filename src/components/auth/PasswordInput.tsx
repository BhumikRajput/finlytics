"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputClass } from "./styles";

type PasswordInputProps = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  placeholder?: string;
};

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  required = true,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className={`${authInputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint hover:text-ink"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
