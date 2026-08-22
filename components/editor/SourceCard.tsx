"use client";

import type { ReactNode } from "react";
import type { GameFieldDef, GameRecord } from "@/lib/game-fields";
import { EditorField } from "@/components/editor/fields/EditorField";

export function EditorFieldItem({
  field,
  game,
  games,
  onChange,
  onPriority,
  showCoverPreview,
}: {
  field: GameFieldDef | undefined;
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
  showCoverPreview?: boolean;
}) {
  if (!field) return null;
  return (
    <EditorField
      field={field}
      game={game}
      games={games}
      onChange={onChange}
      onPriority={onPriority}
      showCoverPreview={showCoverPreview}
    />
  );
}

export function SourceCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="editor-source-card">
      <header className="editor-source-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </header>
      {children}
    </section>
  );
}
