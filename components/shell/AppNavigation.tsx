"use client";

import type { ComponentType, KeyboardEvent, SVGProps } from "react";
import { PLANNING_MODES, type PlanningMode } from "@/components/planning/types";
import { IconAdd, IconLibrary, IconQueue, IconSettings, IconTrophy } from "@/components/m3/icons";
import styles from "./app-navigation.module.css";

const DESTINATIONS: Record<
  PlanningMode,
  { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  library: { label: "Bibliothek", Icon: IconLibrary },
  queue: { label: "Als Nächstes", Icon: IconQueue },
  favorites: { label: "Ranking", Icon: IconTrophy },
};

/**
 * One navigation landmark for every window size: a navigation rail from the
 * medium breakpoint upwards and a bottom navigation bar on compact screens.
 */
export function AppNavigation({
  value,
  onChange,
  onAdd,
  onSettings,
  disabled = false,
}: {
  value: PlanningMode;
  onChange: (mode: PlanningMode) => void;
  onAdd: () => void;
  onSettings: () => void;
  disabled?: boolean;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (disabled || !keys.includes(event.key)) return;
    if (!(event.target as HTMLElement).closest("[data-planning-mode]")) return;
    event.preventDefault();
    const current = PLANNING_MODES.indexOf(value);
    const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? PLANNING_MODES.length - 1
        : (current + step + PLANNING_MODES.length) % PLANNING_MODES.length;
    const next = PLANNING_MODES[nextIndex];
    onChange(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-planning-mode="${next}"]`)
      ?.focus();
  };

  return (
    <nav className={styles.navigation} aria-label="Bibliotheksbereich" onKeyDown={onKeyDown}>
      <button
        type="button"
        className={styles.railFab}
        aria-label="Spiel hinzufügen"
        title="Spiel hinzufügen (N)"
        disabled={disabled}
        onClick={onAdd}
      >
        <IconAdd />
      </button>
      <div className={styles.destinations}>
        {PLANNING_MODES.map((mode) => {
          const { label, Icon } = DESTINATIONS[mode];
          return (
            <button
              key={mode}
              type="button"
              className={styles.destination}
              data-planning-mode={mode}
              aria-current={value === mode ? "page" : undefined}
              tabIndex={value === mode ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(mode)}
            >
              <span className={styles.indicator}>
                <Icon width={24} height={24} />
              </span>
              <span className={styles.label}>{label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.railSettings}
        aria-label="Einstellungen"
        title="Einstellungen"
        onClick={onSettings}
      >
        <IconSettings />
      </button>
    </nav>
  );
}
