"use client";

import { useMemo } from "react";
import { PlanningList } from "./PlanningList";
import { ReorderModeControl } from "./ReorderModeControl";
import { orderedPlanningGames } from "./planning-helpers";
import type { PlanningGame } from "./types";
import styles from "./planning.module.css";

export interface FavoriteRankingViewProps {
  games: readonly PlanningGame[];
  reorderMode: boolean;
  onReorderModeChange: (active: boolean) => void;
  onReorder: (orderedIds: readonly string[]) => void;
  onChangeRank: (gameId: string, rank: number) => void;
  onRemoveRank: (gameId: string) => void;
  onOpenGame?: (gameId: string) => void;
  disabled?: boolean;
}

export function FavoriteRankingView({
  games,
  reorderMode,
  onReorderModeChange,
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
  const reorderAvailable = favorites.length > 1;
  const reordering = reorderMode && reorderAvailable && !disabled;

  return (
    <section className={styles.view} aria-labelledby="favorite-ranking-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Favoriten</p>
          <h2 id="favorite-ranking-title" className={styles.title}>Persönliches Ranking</h2>
          <p className={styles.description}>
            Der persönliche Rang ordnet Favoriten. Er verändert weder Bewertung noch Warteschlange.
          </p>
        </div>
        <span className={styles.count}>{favorites.length} mit persönlichem Rang</span>
      </header>

      <ReorderModeControl
        active={reordering}
        disabled={disabled || !reorderAvailable}
        subject="persönliche Ränge"
        onChange={onReorderModeChange}
      />
      <PlanningList
        games={favorites}
        listLabel="Favoriten nach persönlichem Rang"
        positionLabel="Persönlicher Rang"
        emptyMessage="Noch kein persönlicher Rang vergeben."
        reorderMode={reordering}
        disabled={disabled}
        onReorder={onReorder}
        onOpenGame={onOpenGame}
        renderActions={(game, visiblePosition) => (
          <>
            <label className={styles.rankControl}>
              <span>Rang</span>
              <select
                aria-label={`${game.name || "Unbenanntes Spiel"}: persönlichen Rang ändern`}
                value={visiblePosition}
                disabled={disabled || favorites.length < 2}
                onChange={(event) => onChangeRank(game.id, Number(event.target.value))}
              >
                {favorites.map((_, index) => (
                  <option key={index + 1} value={index + 1}>{index + 1}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.removeButton}
              disabled={disabled}
              onClick={() => onRemoveRank(game.id)}
            >
              Rang entfernen
            </button>
          </>
        )}
      />
    </section>
  );
}
