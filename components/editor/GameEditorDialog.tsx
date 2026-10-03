"use client";

import {
  editorFieldsByGroup,
  type FieldGroup,
  type GameFieldDef,
  type GameRecord,
} from "@/lib/game-fields";
import { M3Dialog } from "@/components/m3/host";
import { IconClose } from "@/components/m3/icons";
import { DeleteGameAction } from "@/components/editor/DeleteGameAction";
import {
  EditorMobileNavigation,
  EditorPager,
  useEditorKeyboardNavigation,
} from "@/components/editor/EditorNavigation";
import { EditorHero } from "@/components/editor/EditorHero";
import { EditorSection } from "@/components/editor/EditorSection";
import { IdentityPanel } from "@/components/editor/IdentityPanel";
import { EditorFieldItem } from "@/components/editor/SourceCard";
import { StatusChipsField } from "@/components/editor/fields/StatusChipsField";
import { SaveStatusIndicator } from "@/components/save-status";

/**
 * Editor sections in order of everyday use. Rarely touched groups start
 * collapsed; every registry field still renders in its group.
 */
const EDITOR_SECTIONS: ReadonlyArray<{
  group: FieldGroup;
  title: string;
  summary?: string;
  collapsible?: boolean;
}> = [
  { group: "status", title: "Status" },
  { group: "personal", title: "Bewertung & Planung" },
  { group: "classification", title: "Einordnung" },
  { group: "progress", title: "Fortschritt", summary: "Schwierigkeit, Spielzeit", collapsible: true },
  { group: "identity", title: "Quellen & Details", summary: "Steam, IGDB, Cover-URL", collapsible: true },
];

export type GameEditorProps = {
  game: GameRecord | null;
  games: GameRecord[];
  visibleGames: GameRecord[];
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<GameRecord>) => void;
  onPriority: (id: string, priority: number | null) => void;
  onPosition: (
    id: string,
    fieldId: "queuePosition" | "favoriteRank",
    position: number | null,
  ) => void;
  onDelete: (id: string) => void;
  onManageMedia?: () => void;
};

export function GameEditor({
  game,
  games,
  visibleGames,
  open,
  onClose,
  onSelect,
  onChange,
  onPriority,
  onPosition,
  onDelete,
  onManageMedia,
}: GameEditorProps) {
  const groups = new Map(editorFieldsByGroup().map((entry) => [entry.group, entry.fields]));
  const nameField = groups.get("identity")?.find((field) => field.id === "name");
  const index = game ? visibleGames.findIndex((item) => item.id === game.id) : -1;
  const prevGame = index > 0 ? visibleGames[index - 1] : null;
  const nextGame = index >= 0 && index < visibleGames.length - 1 ? visibleGames[index + 1] : null;
  const canPage = visibleGames.length > 1 && index >= 0;

  useEditorKeyboardNavigation({ open, game, visibleGames, onSelect });

  return (
    <M3Dialog
      open={open && Boolean(game)}
      onClose={onClose}
      headline={game?.name || "Spiel bearbeiten"}
      className={canPage ? "game-editor-dialog is-paged" : "game-editor-dialog"}
      presentation={canPage ? "editor" : "fullscreen"}
      leadingAction={
        <m3-icon-button aria-label="Editor schließen" onClick={onClose}>
          <IconClose />
        </m3-icon-button>
      }
      actions={game ? <DeleteGameAction key={game.id} onDelete={() => onDelete(game.id)} /> : null}
    >
      {canPage ? (
        <>
          <EditorPager direction="prev" target={prevGame} disabled={!prevGame} onSelect={onSelect} />
          <EditorPager direction="next" target={nextGame} disabled={!nextGame} onSelect={onSelect} />
        </>
      ) : null}
      {game ? (
        <div className="editor-body">
          <p className="visually-hidden" aria-live="polite">
            {index >= 0
              ? `Spiel ${index + 1} von ${visibleGames.length}: ${game.name}`
              : game.name}
          </p>
          <EditorHero key={game.id} game={game} onManageMedia={onManageMedia} />
          <div className="editor-title-row">
            <EditorFieldItem
              key={`${game.id}-name`}
              field={nameField}
              game={game}
              games={games}
              onChange={(patch) => onChange(game.id, patch)}
              onPriority={(priority) => onPriority(game.id, priority)}
              onPosition={(fieldId, position) => onPosition(game.id, fieldId, position)}
            />
            <span className="editor-save-state"><SaveStatusIndicator /></span>
          </div>
          {EDITOR_SECTIONS.map((section) => {
            const fields = groups.get(section.group) ?? [];
            if (fields.length === 0) return null;
            const shared = {
              game,
              games,
              onChange: (patch: Partial<GameRecord>) => onChange(game.id, patch),
              onPriority: (priority: number | null) => onPriority(game.id, priority),
              onPosition: (fieldId: "queuePosition" | "favoriteRank", position: number | null) =>
                onPosition(game.id, fieldId, position),
            };
            return (
              <EditorSection
                key={`${game.id}-${section.group}`}
                id={`editor-${section.group}`}
                title={section.title}
                summary={section.summary}
                collapsible={section.collapsible}
              >
                {section.group === "identity" ? (
                  <IdentityPanel
                    fields={fields.filter((field) => field.id !== "name")}
                    {...shared}
                  />
                ) : (
                  <SectionFields group={section.group} fields={fields} {...shared} />
                )}
              </EditorSection>
            );
          })}
          {canPage ? (
            <EditorMobileNavigation
              prevGame={prevGame}
              nextGame={nextGame}
              index={index}
              total={visibleGames.length}
              onSelect={onSelect}
            />
          ) : null}
        </div>
      ) : null}
    </M3Dialog>
  );
}

export { GameEditor as GameEditorDialog };

function SectionFields({
  group,
  fields,
  game,
  games,
  onChange,
  onPriority,
  onPosition,
}: {
  group: FieldGroup;
  fields: GameFieldDef[];
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
  onPosition: (fieldId: "queuePosition" | "favoriteRank", position: number | null) => void;
}) {
  const chipFields = group === "status" ? fields.filter((field) => field.type === "boolean") : [];
  const otherFields = fields.filter((field) => !chipFields.includes(field));
  return (
    <>
      {chipFields.length > 0 ? (
        <StatusChipsField fields={chipFields} game={game} onChange={onChange} />
      ) : null}
      {otherFields.map((field) => (
        <EditorFieldItem
          key={`${game.id}-${field.id}`}
          field={field}
          game={game}
          games={games}
          onChange={onChange}
          onPriority={onPriority}
          onPosition={onPosition}
        />
      ))}
    </>
  );
}
