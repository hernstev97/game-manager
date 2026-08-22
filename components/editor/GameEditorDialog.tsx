"use client";

import { useState } from "react";
import {
  editorFieldsByGroup,
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
import { EditorTabs } from "@/components/editor/EditorTabs";
import { EditorHero } from "@/components/editor/EditorHero";
import { IdentityPanel } from "@/components/editor/IdentityPanel";
import { EditorField } from "@/components/editor/fields/EditorField";

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
  const groups = editorFieldsByGroup();
  const [tab, setTab] = useState(0);
  const activeGroup = groups[tab]?.group ?? groups[0]?.group;
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
          <EditorTabs groups={groups} activeTab={tab} onChange={setTab} />
          {activeGroup === "identity" ? (
            <EditorHero game={game} onManageMedia={onManageMedia} />
          ) : null}
          <span className="editor-save-state">Änderungen werden automatisch gespeichert.</span>
          {groups.map((group) => (
            <section
              key={`${game.id}-${group.group}`}
              id={`editor-${group.group}`}
              hidden={group.group !== activeGroup}
              className={group.group === "identity" ? "editor-fields editor-identity-fields" : "editor-fields"}
            >
              {group.group === "identity" ? (
                <IdentityPanel
                  fields={group.fields}
                  game={game}
                  games={games}
                  onChange={(patch) => onChange(game.id, patch)}
                  onPriority={(priority) => onPriority(game.id, priority)}
                  onPosition={(fieldId, position) => onPosition(game.id, fieldId, position)}
                />
              ) : (
                group.fields.map((field) => (
                  <EditorField
                    key={`${game.id}-${field.id}`}
                    field={field}
                    game={game}
                    games={games}
                    onChange={(patch) => onChange(game.id, patch)}
                    onPriority={(priority) => onPriority(game.id, priority)}
                    onPosition={(fieldId, position) => onPosition(game.id, fieldId, position)}
                  />
                ))
              )}
            </section>
          ))}
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
