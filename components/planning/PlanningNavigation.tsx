"use client";

import type { KeyboardEvent } from "react";
import {
  PLANNING_MODES,
  type PlanningMode,
} from "@/components/planning/types";
import styles from "./planning.module.css";

const MODE_LABELS: Record<PlanningMode, string> = {
  library: "Bibliothek",
  queue: "Spielwarteschlange",
  favorites: "Persönliches Ranking",
};

export interface PlanningNavigationProps {
  value: PlanningMode;
  onChange: (mode: PlanningMode) => void;
  disabled?: boolean;
  label?: string;
}

export function PlanningNavigation({
  value,
  onChange,
  disabled = false,
  label = "Bibliotheksbereich",
}: PlanningNavigationProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const current = PLANNING_MODES.indexOf(value);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? PLANNING_MODES.length - 1
        : (current + (event.key === "ArrowLeft" ? -1 : 1) + PLANNING_MODES.length)
          % PLANNING_MODES.length;
    const next = PLANNING_MODES[nextIndex];
    onChange(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-planning-mode="${next}"]`)
      ?.focus();
  };

  return (
    <nav className={styles.navigation} aria-label={label} onKeyDown={onKeyDown}>
      {PLANNING_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={styles.navigationButton}
          data-planning-mode={mode}
          aria-current={value === mode ? "page" : undefined}
          tabIndex={value === mode ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(mode)}
        >
          {MODE_LABELS[mode]}
        </button>
      ))}
    </nav>
  );
}
