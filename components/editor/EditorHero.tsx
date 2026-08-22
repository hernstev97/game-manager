"use client";

import type { GameRecord } from "@/lib/game-fields";
import { CoverImage } from "@/components/media/CoverImage";

export function EditorHero({ game }: { game: GameRecord }) {
  return (
    <div className="editor-cover-hero" key={`cover-${game.id}`}>
      <CoverImage
        name={game.name}
        franchise={game.franchise}
        coverUrl={game.coverUrl}
        steamAppId={game.steamAppId}
        className="editor-cover-hero-image"
        sizes="(max-width: 599px) 100vw, 560px"
        eager
      />
    </div>
  );
}
