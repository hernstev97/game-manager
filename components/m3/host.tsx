"use client";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { hostChecked, hostNumber, hostValue, useHostEvent } from "@/components/m3/events";

type DialogEl = HTMLElement & {
  open: boolean;
  show: () => Promise<void>;
  close: (reason?: string) => boolean;
};

type MenuEl = HTMLElement & {
  open: boolean;
  show: (reason?: string, opener?: HTMLElement | null) => void;
  dismiss: (reason?: string) => void;
};

export function M3Dialog({
  open,
  onClose,
  headline,
  children,
  actions,
  className,
}: {
  open: boolean;
  onClose: () => void;
  headline: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const ref = useRef<DialogEl>(null);
  useHostEvent(ref, "dialog-close", onClose);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) void dialog.show();
    if (!open && dialog.open) dialog.close("programmatic");
  }, [open]);

  return (
    <m3-dialog ref={ref as Ref<HTMLElement>} headline={headline} className={className}>
      {children}
      {actions}
    </m3-dialog>
  );
}

export function M3Menu({
  open,
  onOpenChange,
  onSelect,
  placement = "bottom-start",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (value: string) => void;
  placement?:
    | "bottom-start"
    | "bottom-center"
    | "bottom-end"
    | "top-start"
    | "top-center"
    | "top-end";
  children: ReactNode;
}) {
  const ref = useRef<MenuEl>(null);
  useHostEvent(ref, "menu-item-select", (event) => {
    const detail = (event as CustomEvent<{ value?: string }>).detail;
    if (detail?.value != null) onSelect?.(detail.value);
  });
  useHostEvent(ref, "menu-open-change", (event) => {
    const detail = (event as CustomEvent<{ open?: boolean }>).detail;
    onOpenChange(Boolean(detail?.open));
  });

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    if (open && !menu.open) menu.show("programmatic");
    if (!open && menu.open) menu.dismiss("programmatic");
  }, [open]);

  return (
    <m3-menu ref={ref as Ref<HTMLElement>} placement={placement}>
      {children}
    </m3-menu>
  );
}

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

export function M3ListItem({
  children,
  lines = "1",
  selected,
  clickable,
  shape = "rounded",
  value,
  onClick,
  style,
}: {
  children: ReactNode;
  lines?: "1" | "2" | "3";
  selected?: boolean;
  clickable?: boolean;
  shape?: "default" | "rounded" | "full";
  value?: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "item-click", () => onClick?.());
  return (
    <m3-list-item
      ref={ref}
      lines={lines}
      selected={selected}
      clickable={clickable}
      shape={shape}
      value={value}
      style={style}
    >
      {children}
    </m3-list-item>
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

export function M3Tabs({
  activeTab,
  onChange,
  children,
}: {
  activeTab: number;
  onChange: (index: number, value: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "tab-change", (event) => {
    const detail = (event as CustomEvent<{ activeTab?: number; value?: string }>).detail;
    onChange(detail?.activeTab ?? 0, detail?.value ?? "");
  });
  return (
    <m3-tabs ref={ref} activeTab={activeTab}>
      {children}
    </m3-tabs>
  );
}

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
