"use client";

import { useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS } from "@/lib/model/shared";
import { CoverImage } from "@/components/media/CoverImage";

export function EditorHero({
  game,
  onManageMedia,
}: {
  game: GameRecord;
  onManageMedia?: () => void;
}) {
  const [runtimeFailure, setRuntimeFailure] = useState(false);
  const checkResult = game.landscapeArtwork?.imageCheck?.result;
  const broken = runtimeFailure || Boolean(
    checkResult && DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS.includes(
      checkResult as (typeof DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS)[number],
    ),
  );
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
        onSourceError={(url) => {
          if (url === game.coverUrl) setRuntimeFailure(true);
        }}
      />
      {broken ? <span className="editor-cover-warning">Cover nicht ladbar</span> : null}
      {onManageMedia ? (
        <button type="button" className="editor-cover-manage" onClick={onManageMedia}>
          Cover verwalten
        </button>
      ) : null}
    </div>
  );
}
