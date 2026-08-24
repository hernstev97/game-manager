"use client";

import type { AnyGameField, GameRecord } from "@/lib/game-fields";
import { M3TextField } from "@/components/m3/host";
import { CoverImage } from "@/components/media/CoverImage";

export function CoverUrlField({
  field,
  game,
  value,
  onChange,
  showCoverPreview,
}: {
  field: AnyGameField;
  game: GameRecord;
  value: unknown;
  onChange: (patch: Partial<GameRecord>) => void;
  showCoverPreview: boolean;
}) {
  return (
    <div className="field">
      <M3TextField
        label={field.label}
        value={typeof value === "string" ? value : ""}
        onChange={(next) => onChange({ [field.id]: next })}
        placeholder="https://…"
      />
      {showCoverPreview ? (
        <div className="cover-preview">
          <CoverImage
            name={game.name}
            franchise={game.franchise}
            coverUrl={game.coverUrl}
            steamAppId={game.steamAppId}
          />
        </div>
      ) : null}
    </div>
  );
}
