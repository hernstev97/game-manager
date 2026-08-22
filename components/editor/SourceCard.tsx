"use client";

import { useState, type ReactNode } from "react";
import type { GameFieldDef, GameRecord } from "@/lib/game-fields";
import { EditorField } from "@/components/editor/fields/EditorField";
import { FieldProvenanceNote } from "@/components/editor/FieldProvenanceNote";

export function EditorFieldItem({
  field,
  game,
  games,
  onChange,
  onPriority,
  onPosition,
  showCoverPreview,
}: {
  field: GameFieldDef | undefined;
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
  onPosition: (fieldId: "queuePosition" | "favoriteRank", position: number | null) => void;
  showCoverPreview?: boolean;
}) {
  if (!field) return null;
  return (
    <div className="editor-field-with-provenance">
      <EditorField
        field={field}
        game={game}
        games={games}
        onChange={onChange}
        onPriority={onPriority}
        onPosition={onPosition}
        showCoverPreview={showCoverPreview}
      />
      <FieldProvenanceNote game={game} fieldId={field.id} />
    </div>
  );
}

export function SourceCard({
  title,
  subtitle,
  connected,
  children,
}: {
  title: string;
  subtitle: string;
  connected: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(connected);
  return (
    <details
      className="editor-source-card"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary className="editor-source-header">
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <span className="editor-source-status" data-connected={connected}>
          {connected ? "Verbunden" : "Nicht verbunden"}
        </span>
      </summary>
      <div className="editor-source-fields">{children}</div>
    </details>
  );
}
