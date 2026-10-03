"use client";

import { useId, useMemo, useRef, useState } from "react";
import { IconAdd, IconClose, IconSearch } from "@/components/m3/icons";
import type { PlanningGame } from "./types";
import styles from "./planning.module.css";

const MAX_SUGGESTIONS = 8;

export type PlanningPickerAction = { value: string; label: string };

/**
 * Collapsed "add" button that expands into a searchable list of candidates.
 * Replaces long native selects that do not scale with large libraries.
 */
export function PlanningGamePicker({
  candidates,
  triggerLabel,
  emptyLabel,
  actions,
  onPick,
  disabled = false,
}: {
  candidates: readonly PlanningGame[];
  triggerLabel: string;
  emptyLabel: string;
  actions: readonly PlanningPickerAction[];
  onPick: (gameId: string, action: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de");
    const filtered = needle
      ? candidates.filter((game) => (game.name || "").toLocaleLowerCase("de").includes(needle))
      : candidates;
    return filtered.slice(0, MAX_SUGGESTIONS);
  }, [candidates, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        className={styles.addTrigger}
        disabled={disabled || candidates.length === 0}
        onClick={() => setOpen(true)}
      >
        <IconAdd width={20} height={20} />
        {candidates.length === 0 ? emptyLabel : triggerLabel}
      </button>
    );
  }

  return (
    <div
      className={styles.picker}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className={styles.pickerField}>
        <IconSearch width={20} height={20} aria-hidden="true" />
        <label className={styles.visuallyHidden} htmlFor={inputId}>{triggerLabel}: Spiel suchen</label>
        <input
          id={inputId}
          autoFocus
          type="search"
          placeholder="Spiel suchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" className={styles.iconButton} aria-label="Suche schließen" onClick={close}>
          <IconClose width={20} height={20} />
        </button>
      </div>
      {matches.length === 0 ? (
        <p className={styles.pickerEmpty}>Kein passendes Spiel gefunden.</p>
      ) : (
        <ul className={styles.pickerList} aria-label="Vorschläge">
          {matches.map((game) => (
            <li key={game.id} className={styles.pickerItem}>
              <span className={styles.pickerName}>{game.name || "Unbenanntes Spiel"}</span>
              <span className={styles.pickerActions}>
                {actions.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className={styles.textButton}
                    aria-label={`${game.name || "Unbenanntes Spiel"}: ${action.label}`}
                    onClick={() => onPick(game.id, action.value)}
                  >
                    {action.label}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
