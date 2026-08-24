"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { hostValue, useHostEvent } from "@/components/m3/events";

export function M3TextField({
  label,
  value,
  onChange,
  onCommit,
  placeholder,
  type = "text",
  disabled,
  helperText,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  helperText?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "input", (event) => onChange(hostValue(event)));
  useHostEvent(ref, "change", (event) => onCommit?.(hostValue(event)));
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <m3-text-field
      ref={ref}
      variant="outlined"
      label={label}
      value={value}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      helperText={helperText}
    />
  );
}

export function M3SearchBar({
  value,
  onChange,
  placeholder,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "input", (event) => onChange(hostValue(event)));
  return (
    <m3-search-bar
      ref={ref}
      value={value}
      placeholder={placeholder}
      aria-label={label}
    >
      {children}
    </m3-search-bar>
  );
}
