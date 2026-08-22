"use client";

import { useId, useRef, type ReactNode } from "react";
import { hostChecked, hostNumber, useHostEvent } from "@/components/m3/events";

export function M3Chip({
  children,
  variant = "assist",
  selected,
  removable,
  disabled,
  onClick,
  onRemove,
}: {
  children: ReactNode;
  variant?: "assist" | "filter" | "input" | "suggestion";
  selected?: boolean;
  removable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "chip-click", () => onClick?.());
  useHostEvent(ref, "chip-remove", () => onRemove?.());
  return (
    <m3-chip
      ref={ref}
      variant={variant}
      selected={selected}
      removable={removable}
      disabled={disabled}
    >
      {children}
    </m3-chip>
  );
}

export function M3SplitButton({
  children,
  variant = "tonal",
  menuLabel,
  onMainClick,
  onSelect,
}: {
  children: ReactNode;
  variant?: "filled" | "outlined" | "tonal" | "elevated";
  menuLabel: string;
  onMainClick: () => void;
  onSelect?: (value: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "split-button-click", onMainClick);
  useHostEvent(ref, "menu-item-select", (event) => {
    const detail = (event as CustomEvent<{ value?: string }>).detail;
    if (detail?.value != null) onSelect?.(detail.value);
  });
  return (
    <m3-split-button ref={ref} variant={variant} menuLabel={menuLabel}>
      {children}
    </m3-split-button>
  );
}

export function M3Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "change", (event) => onChange(hostChecked(event)));
  return (
    <label className="switch-row" htmlFor={id}>
      <span id={`${id}-label`}>{label}</span>
      <m3-switch
        ref={ref}
        id={id}
        checked={checked}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
      />
    </label>
  );
}

export function M3Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "input", (event) => onChange(hostNumber(event)));
  return <m3-slider ref={ref} min={min} max={max} step={step} value={value} aria-label={label} />;
}

export function M3Radio({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "change", () => onChange(value));
  return (
    <label className="radio-row" htmlFor={id} id={`${id}-label`}>
      <m3-radio-button
        ref={ref}
        id={id}
        name={name}
        value={value}
        checked={checked}
        aria-labelledby={`${id}-label`}
      />
      <span>{label}</span>
    </label>
  );
}
