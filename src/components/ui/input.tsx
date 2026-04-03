"use client";

import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ig-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 rounded-[3px] border bg-[#fafafa] text-ig-text text-sm placeholder:text-ig-muted
          transition-colors
          focus:outline-none focus:ring-0 focus:border-ig-muted focus:bg-white
          ${error ? "border-red-400 focus:border-red-500" : "border-ig-border"}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
