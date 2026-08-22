"use client";

import { useEffect, useRef, useState } from "react";
import {
  editorFieldsByGroup,
  FIELD_GROUP_LABELS,
  type GameFieldDef,
  type GameRecord,
} from "@/lib/game-fields";
import { adjacentGameId } from "@/lib/filter-games";
import { EditorField } from "@/components/field-widgets";
import { M3Dialog, M3Tabs } from "@/components/m3/host";
import { IconChevronLeft, IconChevronRight, IconClose } from "@/components/m3/icons";
import { useHostEvent } from "@/components/m3/events";
import { CoverImage } from "@/components/cover-image";

const IDENTITY_PRIMARY_FIELDS = new Set([
  "name",
  "steamAppId",
  "steamPrice",
  "igdbId",
  "coverUrl",
]);

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

function EditorFieldItem({
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

function IdentityEditorFields({
  fields,
  game,
  games,
  onChange,
  onPriority,
}: {
  fields: GameFieldDef[];
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
}) {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const sharedProps = { game, games, onChange, onPriority };

  return (
    <>
      <EditorFieldItem field={byId.get("name")} {...sharedProps} />

      <div className="editor-source-stack" aria-label="Externe Spieldaten">
        <section className="editor-source-card">
          <header className="editor-source-header">
            <h3>Steam</h3>
            <span>Store &amp; Preis</span>
          </header>
          <EditorFieldItem field={byId.get("steamAppId")} {...sharedProps} />
          <EditorFieldItem field={byId.get("steamPrice")} {...sharedProps} />
        </section>

        <section className="editor-source-card">
          <header className="editor-source-header">
            <h3>IGDB</h3>
            <span>Katalog &amp; Metadaten</span>
          </header>
          <EditorFieldItem field={byId.get("igdbId")} {...sharedProps} />
        </section>
      </div>

      <EditorFieldItem
        field={byId.get("coverUrl")}
        showCoverPreview={false}
        {...sharedProps}
      />

      {fields
        .filter((field) => !IDENTITY_PRIMARY_FIELDS.has(field.id))
        .map((field) => (
          <EditorFieldItem key={field.id} field={field} {...sharedProps} />
        ))}
    </>
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
      presentation={canPage ? "editor" : "fullscreen"}
      leadingAction={
        <m3-icon-button aria-label="Editor schließen" onClick={onClose}>
          <IconClose />
        </m3-icon-button>
      }
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
            scrollableOnMobile
          >
            {groups.map((group) => (
              <m3-tab key={group.group} panel={`editor-${group.group}`} value={group.group}>
                {FIELD_GROUP_LABELS[group.group]}
              </m3-tab>
            ))}
          </M3Tabs>
          {activeGroup === "identity" ? (
            <div className="editor-cover-hero" key={`cover-${game.id}`}>
              <CoverImage
                name={game.name}
                franchise={game.franchise}
                coverUrl={game.coverUrl}
                steamAppId={game.steamAppId}
                className="editor-cover-hero-image"
                sizes="(max-width: 599px) 100vw, 560px"
                eager
              />
            </div>
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
                <IdentityEditorFields
                  fields={group.fields}
                  game={game}
                  games={games}
                  onChange={(patch) => onChange(game.id, patch)}
                  onPriority={(priority) => onPriority(game.id, priority)}
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
                  />
                ))
              )}
            </section>
          ))}
          {canPage ? (
            <nav className="editor-mobile-nav" aria-label="Zwischen Spielen wechseln">
              <m3-icon-button
                aria-label={prevGame ? `Vorheriges Spiel: ${prevGame.name}` : "Kein vorheriges Spiel"}
                disabled={!prevGame}
                onClick={() => prevGame && onSelect(prevGame.id)}
              >
                <IconChevronLeft />
              </m3-icon-button>
              <span>{index + 1} von {visibleGames.length}</span>
              <m3-icon-button
                aria-label={nextGame ? `Nächstes Spiel: ${nextGame.name}` : "Kein nächstes Spiel"}
                disabled={!nextGame}
                onClick={() => nextGame && onSelect(nextGame.id)}
              >
                <IconChevronRight />
              </m3-icon-button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </M3Dialog>
  );
}
