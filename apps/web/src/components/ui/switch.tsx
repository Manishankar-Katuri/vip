"use client";

import type React from "react";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  disabled,
  onCheckedChange,
  "aria-label": ariaLabel
}: Readonly<{
  checked:boolean;
  disabled?:boolean;
  onCheckedChange:(checked:boolean) => void;
  "aria-label"?:string;
}>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
        checked
          ? "border-emerald-600 bg-emerald-600"
          : "border-slate-300 bg-slate-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
