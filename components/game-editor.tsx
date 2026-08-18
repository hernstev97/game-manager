"use client";

import { useState } from "react";
import {
  editorFieldsByGroup,
  FIELD_GROUP_LABELS,
  type GameRecord,
} from "@/lib/game-fields";
import { EditorField } from "@/components/field-widgets";
import { M3Dialog, M3Tabs } from "@/components/m3/host";

function DeleteFooter({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <>
        <span slot="actions">Dieses Spiel wirklich löschen?</span>
        <m3-button slot="actions" className="danger-button" onClick={onDelete}>
          Löschen
        </m3-button>
        <m3-button slot="actions" variant="text" onClick={() => setConfirming(false)}>
          Abbrechen
        </m3-button>
      </>
    );
  }
  return (
    <m3-button slot="actions" className="danger-button" variant="text" onClick={() => setConfirming(true)}>
      Spiel löschen
    </m3-button>
  );
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
  const [tab, setTab] = useState(0);
  const activeGroup = groups[tab]?.group ?? groups[0]?.group;

  return (
    <M3Dialog
      open={open && Boolean(game)}
      onClose={onClose}
      headline={game?.name || "Spiel bearbeiten"}
      actions={game ? <DeleteFooter key={game.id} onDelete={() => onDelete(game.id)} /> : null}
    >
      {game ? (
        <div className="editor-body">
          <M3Tabs
            activeTab={tab}
            onChange={(index) => setTab(index)}
          >
            {groups.map((group) => (
              <m3-tab key={group.group} panel={`editor-${group.group}`} value={group.group}>
                {FIELD_GROUP_LABELS[group.group]}
              </m3-tab>
            ))}
          </M3Tabs>
          {groups.map((group) => (
            <section
              key={group.group}
              id={`editor-${group.group}`}
              hidden={group.group !== activeGroup}
              className="editor-fields"
            >
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
            </section>
          ))}
        </div>
      ) : null}
    </M3Dialog>
  );
}
