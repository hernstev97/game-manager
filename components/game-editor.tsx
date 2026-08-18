"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  editorFieldsByGroup,
  FIELD_GROUP_LABELS,
  type GameRecord,
} from "@/lib/game-fields";
import { EditorField } from "@/components/field-widgets";
import { CoverImage } from "@/components/cover-image";
import { DangerButton, IconButton, TextButton } from "@/components/ui";

function DeleteFooter({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="confirm-row">
        <span>Dieses Spiel wirklich löschen?</span>
        <DangerButton onClick={onDelete}>Löschen</DangerButton>
        <TextButton onClick={() => setConfirming(false)}>Abbrechen</TextButton>
      </div>
    );
  }
  return <DangerButton onClick={() => setConfirming(true)}>Spiel löschen</DangerButton>;
}

export function GameEditor({
  game,
  games,
  open,
  onClose,
  onChange,
  onPriority,
  onDelete,
}: {
  game: GameRecord | null;
  games: GameRecord[];
  open: boolean;
  onClose: () => void;
  onChange: (id: string, patch: Partial<GameRecord>) => void;
  onPriority: (id: string, priority: number | null) => void;
  onDelete: (id: string) => void;
}) {
  const groups = editorFieldsByGroup();

  return (
    <>
      <button
        type="button"
        className={open ? "drawer-scrim is-open" : "drawer-scrim"}
        aria-label="Editor schließen"
        onClick={onClose}
        hidden={!open}
      />
      <aside className={open ? "editor-drawer is-open" : "editor-drawer"} aria-hidden={!open}>
        {game ? (
          <>
            <header className="drawer-head">
              <div className="drawer-identity">
                <div className="drawer-cover">
                  <CoverImage
                    name={game.name}
                    franchise={game.franchise}
                    coverUrl={game.coverUrl}
                    steamAppId={game.steamAppId}
                  />
                </div>
                <div>
                  <p className="drawer-kicker">Bearbeiten</p>
                  <h2>{game.name || "Unbenanntes Spiel"}</h2>
                </div>
              </div>
              <IconButton label="Schließen" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </header>
            <div className="drawer-body">
              {groups.map((group) => (
                <section key={group.group} className="editor-group">
                  <h3>{FIELD_GROUP_LABELS[group.group]}</h3>
                  <div className="editor-fields">
                    {group.fields.map((field) => (
                      <EditorField
                        key={field.id}
                        field={field}
                        game={game}
                        games={games}
                        onChange={(patch) => onChange(game.id, patch)}
                        onPriority={(priority) => onPriority(game.id, priority)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <footer className="drawer-foot">
              <DeleteFooter key={game.id} onDelete={() => onDelete(game.id)} />
            </footer>
          </>
        ) : null}
      </aside>
    </>
  );
}
