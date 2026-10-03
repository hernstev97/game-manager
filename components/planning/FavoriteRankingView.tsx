"use client";

import { useMemo } from "react";
import { PlanningGamePicker } from "./PlanningGamePicker";
import { PlanningList } from "./PlanningList";
import { PlanningRowMenu } from "./PlanningRowMenu";
import { orderedPlanningGames } from "./planning-helpers";
import type { PlanningGame } from "./types";
import styles from "./planning.module.css";

export interface FavoriteRankingViewProps {
  games: readonly PlanningGame[];
  onReorder: (orderedIds: readonly string[]) => void;
  onChangeRank: (gameId: string, rank: number) => void;
  onRemoveRank: (gameId: string) => void;
  onOpenGame?: (gameId: string) => void;
  disabled?: boolean;
}

const RANK_ACTIONS = [{ value: "append", label: "Ranken" }] as const;

export function FavoriteRankingView({
  games,
  onReorder,
  onChangeRank,
  onRemoveRank,
  onOpenGame,
  disabled = false,
}: FavoriteRankingViewProps) {
  const favorites = useMemo(
    () => orderedPlanningGames(games, "favoriteRank"),
    [games],
  );
  const candidates = useMemo(
    () => {
      const rankedIds = new Set(favorites.map((game) => game.id));
      return games
        .filter((game) => !rankedIds.has(game.id))
        .toSorted((left, right) => left.name.localeCompare(right.name, "de", {
          sensitivity: "base",
        }));
    },
    [games, favorites],
  );

  return (
    <section className={styles.view} aria-label="Persönliches Ranking">
      <div className={styles.intro}>
        <p className={styles.description}>
          Deine Lieblingsspiele in Reihenfolge. Das Ranking ändert weder Bewertung noch Warteschlange.
        </p>
        <span className={styles.count}>{favorites.length} gerankt</span>
      </div>

      <PlanningGamePicker
        candidates={candidates}
        triggerLabel="Spiel ranken"
        emptyLabel="Alle Spiele sind gerankt"
        actions={RANK_ACTIONS}
        disabled={disabled}
        onPick={(gameId) => onChangeRank(gameId, favorites.length + 1)}
      />

      <PlanningList
        games={favorites}
        listLabel="Favoriten nach persönlichem Rang"
        positionLabel="Persönlicher Rang"
        emptyMessage="Noch kein Spiel gerankt. Füge oben deinen ersten Favoriten hinzu."
        disabled={disabled}
        onReorder={onReorder}
        onOpenGame={onOpenGame}
        renderActions={(game, position) => (
          <PlanningRowMenu
            gameName={game.name || "Unbenanntes Spiel"}
            disabled={disabled}
            actions={[
              { value: "top", label: "Auf Platz 1", disabled: position === 1 },
              { value: "bottom", label: "Ans Ende", disabled: position === favorites.length },
              { value: "remove", label: "Rang entfernen" },
            ]}
            onAction={(action) => {
              if (action === "remove") onRemoveRank(game.id);
              else if (action === "top") onChangeRank(game.id, 1);
              else onChangeRank(game.id, favorites.length);
            }}
          />
        )}
      />
    </section>
  );
}
