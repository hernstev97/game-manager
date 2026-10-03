"use client";

import { useId, type ReactNode } from "react";
import { IconExpandMore } from "@/components/m3/icons";

/**
 * M3 outlined select. The @banegasn kit has no select, so this wraps the
 * native element (keyboard, mobile pickers, form semantics stay intact) in
 * the outlined text-field anatomy with a floating label.
 */
export function M3Select({
  label,
  value,
  onChange,
  children,
  disabled,
  name,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={["m3-select", className].filter(Boolean).join(" ")} data-disabled={disabled || undefined}>
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <label className="m3-select-label" htmlFor={id}>{label}</label>
      <IconExpandMore className="m3-select-arrow" aria-hidden="true" />
    </div>
  );
}
