"use client";

import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("icon-btn", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TonalButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("btn btn-tonal", className)} {...props}>
      {children}
    </button>
  );
}

export function FilledButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("btn btn-filled", className)} {...props}>
      {children}
    </button>
  );
}

export function TextButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("btn btn-text", className)} {...props}>
      {children}
    </button>
  );
}

export function DangerButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("btn btn-danger", className)} {...props}>
      {children}
    </button>
  );
}

export function OutlinedButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("btn btn-outlined", className)} {...props}>
      {children}
    </button>
  );
}

type ChipTone = "primary" | "secondary" | "tertiary" | "neutral" | "outline";

export function Chip({
  selected,
  tone = "neutral",
  onClick,
  onDismiss,
  children,
  className,
  title,
}: {
  selected?: boolean;
  tone?: ChipTone;
  onClick?: () => void;
  onDismiss?: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      title={title}
      onClick={onClick}
      className={cn("chip", `chip-${tone}`, selected && "chip-selected", className)}
    >
      {children}
      {onDismiss ? (
        <span
          role="button"
          tabIndex={0}
          className="chip-dismiss"
          aria-label="Entfernen"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onDismiss();
            }
          }}
        >
          ×
        </span>
      ) : null}
    </Tag>
  );
}

export function Switch({
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
  return (
    <div className={cn("switch-row", disabled && "is-disabled")}>
      <span id={`${id}-label`}>{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-labelledby={`${id}-label`}
        aria-checked={checked}
        disabled={disabled}
        className={cn("switch", checked && "is-on")}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label ? <span className="field-label">{label}</span> : null}
      <input
        id={id}
        className="field-input"
        value={value}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 5,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label ? <span className="field-label">{label}</span> : null}
      <textarea
        id={id}
        className="field-input field-textarea"
        value={value}
        rows={rows}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label ? <span className="field-label">{label}</span> : null}
      <select
        id={id}
        className="field-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Popover({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={cn("popover", className)} role="dialog">
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const firstField = modalRef.current?.querySelector<HTMLElement>(
        "input:not([type='hidden']), select, textarea",
      );
      (firstField ?? modalRef.current?.querySelector<HTMLElement>("button"))?.focus();
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="scrim" aria-label="Schließen" onClick={onClose} />
      <div
        ref={modalRef}
        className={cn("modal", wide && "modal-wide")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Schließen" onClick={onClose}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </header>
        {children}
      </div>
    </div>
  );
}
