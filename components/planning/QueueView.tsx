"use client";

import { useMemo } from "react";
import { PlanningGamePicker } from "./PlanningGamePicker";
import { PlanningList } from "./PlanningList";
import { PlanningRowMenu } from "./PlanningRowMenu";
import { orderedPlanningGames, planningOrderWithEdgeMove } from "./planning-helpers";
import type { PlanningGame, QueueInsertion } from "./types";
import styles from "./planning.module.css";

export interface QueueViewProps {
  games: readonly PlanningGame[];
  onReorder: (orderedIds: readonly string[]) => void;
  onInsert: (gameId: string, placement: QueueInsertion) => void;
  onRemove: (gameId: string) => void;
  onOpenGame?: (gameId: string) => void;
  disabled?: boolean;
}

const INSERT_ACTIONS = [
  { value: "first", label: "Als Nächstes" },
  { value: "last", label: "Ans Ende" },
] as const;

export function QueueView({
  games,
  onReorder,
  onInsert,
  onRemove,
  onOpenGame,
  disabled = false,
}: QueueViewProps) {
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

  return (
    <section className={styles.view} aria-label="Spielwarteschlange">
      <div className={styles.intro}>
        <p className={styles.description}>
          Deine Reihenfolge für die nächsten Spiele – unabhängig von Bewertung und Status.
        </p>
        <span className={styles.count}>{queuedGames.length} eingereiht</span>
      </div>

      <PlanningGamePicker
        candidates={candidates}
        triggerLabel="Spiel einreihen"
        emptyLabel="Alle Spiele sind eingereiht"
        actions={INSERT_ACTIONS}
        disabled={disabled}
        onPick={(gameId, action) => onInsert(gameId, action as QueueInsertion)}
      />

      <PlanningList
        games={queuedGames}
        listLabel="Warteschlange nach Spielreihenfolge"
        positionLabel="Spielreihenfolge"
        emptyMessage="Noch nichts eingereiht. Wähle oben ein Spiel, das du als Nächstes spielen willst."
        disabled={disabled}
        onReorder={onReorder}
        onOpenGame={onOpenGame}
        renderActions={(game, position) => (
          <PlanningRowMenu
            gameName={game.name || "Unbenanntes Spiel"}
            disabled={disabled}
            actions={[
              { value: "start", label: "An den Anfang", disabled: position === 1 },
              { value: "end", label: "Ans Ende", disabled: position === queuedGames.length },
              { value: "remove", label: "Aus Warteschlange entfernen" },
            ]}
            onAction={(action) => {
              if (action === "remove") {
                onRemove(game.id);
                return;
              }
              const next = planningOrderWithEdgeMove(queuedGames, game.id, action as "start" | "end");
              if (next) onReorder(next);
            }}
          />
        )}
      />
    </section>
  );
}
