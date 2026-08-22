"use client";

import type { GameRecord } from "@/lib/game-fields";
import { ResultItem } from "@/components/add-game/ResultItem";

export function ExistingGameResults({
  games,
  onOpenExisting,
}: {
  games: GameRecord[];
  onOpenExisting: (id: string) => void;
}) {
  if (games.length === 0) return null;

  return (
    <section>
      <h3>Bereits in der Bibliothek</h3>
      <m3-list>
        {games.map((game) => (
          <ResultItem
            key={game.id}
            id={game.id}
            name={game.name}
            supporting={game.franchise}
            coverUrl={game.coverUrl}
            steamAppId={game.steamAppId}
            onChoose={() => onOpenExisting(game.id)}
          />
        ))}
      </m3-list>
    </section>
  );
}
