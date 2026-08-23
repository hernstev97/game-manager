"use client";

import { useId, useMemo, useRef } from "react";
import { PlanningList } from "./PlanningList";
import { ReorderModeControl } from "./ReorderModeControl";
import { orderedPlanningGames } from "./planning-helpers";
import type { PlanningGame, QueueInsertion } from "./types";
import styles from "./planning.module.css";

export interface QueueViewProps {
  games: readonly PlanningGame[];
  reorderMode: boolean;
  onReorderModeChange: (active: boolean) => void;
  onReorder: (orderedIds: readonly string[]) => void;
  onInsert: (gameId: string, placement: QueueInsertion) => void;
  onRemove: (gameId: string) => void;
  onOpenGame?: (gameId: string) => void;
  disabled?: boolean;
}

export function QueueView({
  games,
  reorderMode,
  onReorderModeChange,
  onReorder,
  onInsert,
  onRemove,
  onOpenGame,
  disabled = false,
}: QueueViewProps) {
  const candidateId = useId();
  const selectRef = useRef<HTMLSelectElement>(null);
  const queuedGames = useMemo(
    () => orderedPlanningGames(games, "queuePosition"),
    [games],
  );
  const candidates = useMemo(
    () => {
      const queuedIds = new Set(queuedGames.map((game) => game.id));
      return games
        .filter((game) => !queuedIds.has(game.id))
        .toSorted((left, right) => left.name.localeCompare(right.name, "de", {
          sensitivity: "base",
        }));
    },
    [games, queuedGames],
  );
  const insert = (placement: QueueInsertion) => {
    const gameId = selectRef.current?.value;
    if (gameId) onInsert(gameId, placement);
  };
  const reorderAvailable = queuedGames.length > 1;
  const reordering = reorderMode && reorderAvailable && !disabled;

  return (
    <section className={styles.view} aria-labelledby="queue-view-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Planung</p>
          <h2 id="queue-view-title" className={styles.title}>Spielwarteschlange</h2>
          <p className={styles.description}>
            Die sichtbare Nummer ist die Spielreihenfolge – unabhängig von Bewertung und Status.
          </p>
        </div>
        <span className={styles.count}>{queuedGames.length} in der Warteschlange</span>
      </header>

      <div className={styles.insertionPanel}>
        <label className={styles.candidateLabel} htmlFor={candidateId}>
          Spiel hinzufügen
        </label>
        <select
          ref={selectRef}
          id={candidateId}
          className={styles.select}
          disabled={disabled || candidates.length === 0}
          defaultValue={candidates[0]?.id ?? ""}
        >
          {candidates.length === 0 ? <option value="">Alle Spiele sind eingeordnet</option> : null}
          {candidates.map((game) => (
            <option key={game.id} value={game.id}>{game.name || "Unbenanntes Spiel"}</option>
          ))}
        </select>
        <div className={styles.insertionActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={disabled || candidates.length === 0}
            onClick={() => insert("first")}
          >
            An erste Position
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={disabled || candidates.length === 0}
            onClick={() => insert("last")}
          >
            An letzte Position
          </button>
        </div>
      </div>

      <ReorderModeControl
        active={reordering}
        disabled={disabled || !reorderAvailable}
        subject="Spielreihenfolge"
        onChange={onReorderModeChange}
      />
      <PlanningList
        games={queuedGames}
        listLabel="Warteschlange nach Spielreihenfolge"
        positionLabel="Spielreihenfolge"
        emptyMessage="Die Spielwarteschlange ist leer. Füge ein Spiel an der ersten oder letzten Position ein."
        reorderMode={reordering}
        disabled={disabled}
        onReorder={onReorder}
        onOpenGame={onOpenGame}
        renderActions={(game) => (
          <button
            type="button"
            className={styles.removeButton}
            disabled={disabled}
            onClick={() => onRemove(game.id)}
          >
            Entfernen
          </button>
        )}
      />
    </section>
  );
}
