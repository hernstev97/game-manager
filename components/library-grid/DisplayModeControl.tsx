"use client";

import { useRef, type KeyboardEvent } from "react";
import styles from "./library-grid.module.css";

export const DISPLAY_MODES = ["list", "compact", "grid"] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

const LABELS: Record<DisplayMode, string> = {
  list: "Liste",
  compact: "Kompakt",
  grid: "Cover-Raster",
};

export function DisplayModeControl({
  value,
  onChange,
  disabled = false,
  label = "Darstellung",
}: {
  value: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  disabled?: boolean;
  label?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(event.key)) return;
    event.preventDefault();
    const current = DISPLAY_MODES.indexOf(value);
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? DISPLAY_MODES.length - 1
        : (current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + DISPLAY_MODES.length) % DISPLAY_MODES.length;
    const mode = DISPLAY_MODES[next];
    onChange(mode);
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-mode="${mode}"]`)?.focus();
  };

  return (
    <div
      ref={groupRef}
      className={styles.modeControl}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {DISPLAY_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          data-mode={mode}
          tabIndex={value === mode ? 0 : -1}
          disabled={disabled}
          className={styles.modeButton}
          onClick={() => onChange(mode)}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
