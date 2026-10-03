"use client";

import type { GameFieldDef, GameRecord } from "@/lib/game-fields";
import { EditorFieldItem, SourceCard } from "@/components/editor/SourceCard";

const IDENTITY_PRIMARY_FIELDS = new Set([
  "steamAppId",
  "steamPrice",
  "igdbId",
  "coverUrl",
]);

export function IdentityPanel({
  fields,
  game,
  games,
  onChange,
  onPriority,
  onPosition,
}: {
  fields: GameFieldDef[];
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
  onPosition: (fieldId: "queuePosition" | "favoriteRank", position: number | null) => void;
}) {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const sharedProps = { game, games, onChange, onPriority, onPosition };

  return (
    <>
      <div className="editor-source-stack" aria-label="Externe Spieldaten">
        <SourceCard
          title="Steam"
          subtitle="Store &amp; Preis"
          connected={game.steamAppId != null}
        >
          <EditorFieldItem field={byId.get("steamAppId")} {...sharedProps} />
          <EditorFieldItem field={byId.get("steamPrice")} {...sharedProps} />
        </SourceCard>

        <SourceCard
          title="IGDB"
          subtitle="Katalog &amp; Metadaten"
          connected={game.igdbId != null}
        >
          <EditorFieldItem field={byId.get("igdbId")} {...sharedProps} />
        </SourceCard>
      </div>

      <EditorFieldItem field={byId.get("coverUrl")} showCoverPreview={false} {...sharedProps} />

      {fields
        .filter((field) => !IDENTITY_PRIMARY_FIELDS.has(field.id))
        .map((field) => (
          <EditorFieldItem key={field.id} field={field} {...sharedProps} />
        ))}
    </>
  );
}
