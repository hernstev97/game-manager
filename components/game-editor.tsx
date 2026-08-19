"use client";

import { useEffect, useRef, useState } from "react";
import {
  editorFieldsByGroup,
  FIELD_GROUP_LABELS,
  type GameRecord,
} from "@/lib/game-fields";
import { adjacentGameId } from "@/lib/filter-games";
import { EditorField } from "@/components/field-widgets";
import { M3Dialog, M3Tabs } from "@/components/m3/host";
import { IconChevronLeft, IconChevronRight } from "@/components/m3/icons";
import { useHostEvent } from "@/components/m3/events";

const EDITOR_DIALOG_STYLE = `
:host(.is-paged) .dialog[open] {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-width: min(664px, calc(100vw - 24px));
  width: min(664px, calc(100vw - 24px));
  background-color: var(--md-sys-color-surface-container, #f2ecf4);
  overflow: hidden;
}
:host(.is-paged) .dialog[open] .icon-slot {
  display: none !important;
}
:host(.is-paged) .dialog[open] .headline {
  grid-column: 2;
  grid-row: 1;
  background-color: var(--md-sys-color-surface-container-high, #ece6ee);
}
:host(.is-paged) .dialog[open] .content,
:host(.is-paged) .dialog[open] .content > slot {
  display: contents;
}
:host(.is-paged) .dialog[open] .actions {
  grid-column: 2;
  grid-row: 3;
  background-color: var(--md-sys-color-surface-container-high, #ece6ee);
}
`;

function shouldIgnoreEditorNav(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "M3-TEXT-FIELD" ||
    tag === "M3-SEARCH-BAR" ||
    tag === "M3-SLIDER" ||
    tag === "M3-TAB" ||
    tag === "M3-TABS"
  ) {
    return true;
  }
  return Boolean(target.closest("m3-tabs, m3-text-field, m3-slider, m3-search-bar"));
}

function applyEditorDialogChrome(host: Element | null) {
  const root = host?.shadowRoot;
  if (!root) return;
  let style = root.querySelector<HTMLStyleElement>("style[data-editor-pager]");
  if (!style) {
    style = document.createElement("style");
    style.dataset.editorPager = "";
    root.appendChild(style);
  }
  style.textContent = EDITOR_DIALOG_STYLE;
}

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

function EditorPager({
  direction,
  target,
  disabled,
  onSelect,
}: {
  direction: "prev" | "next";
  target: GameRecord | null;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const label =
    direction === "prev"
      ? target
        ? `Vorheriges Spiel: ${target.name}`
        : "Vorheriges Spiel"
      : target
        ? `Nächstes Spiel: ${target.name}`
        : "Nächstes Spiel";

  useHostEvent(ref, "click", () => {
    if (target) onSelect(target.id);
  });

  return (
    <button
      ref={ref}
      type="button"
      className={`editor-pager editor-pager-${direction}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-keyshortcuts={direction === "prev" ? "ArrowLeft" : "ArrowRight"}
    >
      {direction === "prev" ? (
        <IconChevronLeft width={28} height={28} />
      ) : (
        <IconChevronRight width={28} height={28} />
      )}
    </button>
  );
}

export function GameEditor({
  game,
  games,
  visibleGames,
  open,
  onClose,
  onSelect,
  onChange,
  onPriority,
  onDelete,
}: {
  game: GameRecord | null;
  games: GameRecord[];
  visibleGames: GameRecord[];
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<GameRecord>) => void;
  onPriority: (id: string, priority: number | null) => void;
  onDelete: (id: string) => void;
}) {
  const groups = editorFieldsByGroup();
  const [tab, setTab] = useState(0);
  const activeGroup = groups[tab]?.group ?? groups[0]?.group;
  const index = game ? visibleGames.findIndex((item) => item.id === game.id) : -1;
  const prevGame = index > 0 ? visibleGames[index - 1] : null;
  const nextGame = index >= 0 && index < visibleGames.length - 1 ? visibleGames[index + 1] : null;
  const canPage = visibleGames.length > 1 && index >= 0;

  useEffect(() => {
    if (!open) return;
    const host = document.querySelector("m3-dialog.game-editor-dialog");
    if (!host) return;
    const apply = () => applyEditorDialogChrome(host);
    apply();
    host.addEventListener("dialog-open", apply);
    return () => host.removeEventListener("dialog-open", apply);
  }, [open, canPage]);

  useEffect(() => {
    if (!open || !game) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (shouldIgnoreEditorNav(event.target)) return;
      event.preventDefault();
      const nextId = adjacentGameId(visibleGames, game.id, event.key === "ArrowLeft" ? -1 : 1);
      if (nextId) onSelect(nextId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, game, visibleGames, onSelect]);

  return (
    <M3Dialog
      open={open && Boolean(game)}
      onClose={onClose}
      headline={game?.name || "Spiel bearbeiten"}
      className={canPage ? "game-editor-dialog is-paged" : "game-editor-dialog"}
      actions={game ? <DeleteFooter key={game.id} onDelete={() => onDelete(game.id)} /> : null}
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
                  key={`${game.id}-${field.id}`}
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
