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

type DialogPresentation = "default" | "fullscreen" | "sheet" | "editor";

const ADAPTIVE_DIALOG_STYLE = `
:host(.adaptive-fullscreen) .icon-slot,
:host(.adaptive-editor) .icon-slot {
  display: none;
}

:host(.adaptive-editor) .dialog[open] {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-width: min(664px, calc(100vw - 24px));
  width: min(664px, calc(100vw - 24px));
  background-color: var(--md-sys-color-surface-container, #f2ecf4);
  overflow: hidden;
}

:host(.adaptive-editor) .dialog[open] .headline {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  background-color: var(--md-sys-color-surface-container-high, #ece6ee);
}

:host(.adaptive-editor) .dialog[open] .content,
:host(.adaptive-editor) .dialog[open] .content > slot {
  display: contents;
}

:host(.adaptive-editor) .dialog[open] .actions {
  grid-column: 2;
  grid-row: 3;
  background-color: var(--md-sys-color-surface-container-high, #ece6ee);
}

@media (max-width: 599px) {
  :host(.adaptive-fullscreen) .dialog[open],
  :host(.adaptive-editor) .dialog[open] {
    box-sizing: border-box;
    width: 100vw;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    border-radius: 0;
    grid-template-columns: 56px minmax(0, 1fr);
    grid-template-rows: calc(56px + env(safe-area-inset-top)) minmax(0, 1fr) auto;
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
  }

  :host(.adaptive-fullscreen) .dialog[open] {
    display: grid;
  }

  :host(.adaptive-fullscreen) .dialog[open] .icon-slot,
  :host(.adaptive-editor) .dialog[open] .icon-slot {
    box-sizing: border-box;
    display: flex !important;
    grid-column: 1;
    grid-row: 1;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: env(safe-area-inset-top) 4px 0;
    color: var(--md-sys-color-on-surface, #1d1b20);
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
  }

  :host(.adaptive-fullscreen) .dialog[open] .headline,
  :host(.adaptive-editor) .dialog[open] .headline {
    box-sizing: border-box;
    grid-column: 2;
    grid-row: 1;
    align-self: stretch;
    min-width: 0;
    margin: 0;
    padding: calc(12px + env(safe-area-inset-top)) 16px 12px 0;
    overflow: hidden;
    color: var(--md-sys-color-on-surface, #1d1b20);
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 2rem;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host(.adaptive-fullscreen) .dialog[open] .content {
    grid-column: 1 / -1;
    grid-row: 2;
    min-height: 0;
    padding: 12px 16px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  :host(.adaptive-fullscreen) .dialog[open] .actions,
  :host(.adaptive-editor) .dialog[open] .actions {
    grid-column: 1 / -1;
    grid-row: 3;
    min-width: 0;
    padding: 10px 16px max(12px, env(safe-area-inset-bottom));
    flex-wrap: wrap;
    background-color: var(--md-sys-color-surface-container-high, #ece6ee);
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4cf);
  }

  :host(.adaptive-sheet) .dialog[open] {
    width: 100vw;
    max-width: none;
    max-height: min(88dvh, 760px);
    margin: auto 0 0;
    border-radius: 28px 28px 0 0;
  }

  :host(.adaptive-sheet) .dialog[open] .headline {
    padding: 20px 20px 12px;
    text-align: left;
  }

  :host(.adaptive-sheet) .dialog[open] .content {
    min-height: 0;
    padding: 0 16px 20px;
    overscroll-behavior: contain;
  }

  :host(.adaptive-sheet) .dialog[open] .actions {
    padding: 10px 16px max(12px, env(safe-area-inset-bottom));
    flex-wrap: wrap;
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4cf);
  }
}
`;

const RESPONSIVE_TABS_STYLE = `
@media (max-width: 599px) {
  :host(.mobile-scrollable) {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  :host(.mobile-scrollable)::-webkit-scrollbar {
    display: none;
  }

  :host(.mobile-scrollable) .tabs-container {
    width: max-content;
    min-width: 100%;
  }

  :host(.mobile-scrollable) ::slotted(m3-tab) {
    flex: 0 0 auto;
    min-width: max-content;
  }
}
`;

function installShadowStyle(host: HTMLElement | null, key: string, css: string) {
  const root = host?.shadowRoot;
  if (!root) return;
  let style = root.querySelector<HTMLStyleElement>(`style[data-ggrid-${key}]`);
  if (!style) {
    style = document.createElement("style");
    style.dataset[`ggrid${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`] = "";
    root.appendChild(style);
  }
  style.textContent = css;
}

export function M3Dialog({
  open,
  onClose,
  headline,
  children,
  actions,
  className,
  presentation = "default",
  leadingAction,
}: {
  open: boolean;
  onClose: () => void;
  headline: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  presentation?: DialogPresentation;
  leadingAction?: ReactNode;
}) {
  const ref = useRef<DialogEl>(null);
  useHostEvent(ref, "dialog-close", onClose);

  const presentationClass =
    presentation === "default" ? "" : `adaptive-${presentation}`;
  const classes = [className, presentationClass].filter(Boolean).join(" ");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const apply = () => installShadowStyle(dialog, "dialog", ADAPTIVE_DIALOG_STYLE);
    apply();
    dialog.addEventListener("dialog-open", apply);
    return () => dialog.removeEventListener("dialog-open", apply);
  }, [presentation]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) void dialog.show();
    if (!open && dialog.open) dialog.close("programmatic");
  }, [open]);

  return (
    <m3-dialog ref={ref as Ref<HTMLElement>} open={open} headline={headline} className={classes}>
      {leadingAction ? (
        <span slot="icon" className="dialog-leading-action">
          {leadingAction}
        </span>
      ) : null}
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
  scrollableOnMobile = false,
  className,
}: {
  activeTab: number;
  onChange: (index: number, value: string) => void;
  children: ReactNode;
  scrollableOnMobile?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "tab-change", (event) => {
    const detail = (event as CustomEvent<{ activeTab?: number; value?: string }>).detail;
    onChange(detail?.activeTab ?? 0, detail?.value ?? "");
  });

  useEffect(() => {
    if (!scrollableOnMobile) return;
    installShadowStyle(ref.current, "tabs", RESPONSIVE_TABS_STYLE);
  }, [scrollableOnMobile]);

  const classes = [className, scrollableOnMobile ? "mobile-scrollable" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <m3-tabs ref={ref} activeTab={activeTab} className={classes}>
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
