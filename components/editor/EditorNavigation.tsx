"use client";

import { useEffect, useRef } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { adjacentGameId } from "@/lib/filter-games";
import { IconChevronLeft, IconChevronRight } from "@/components/m3/icons";
import { useHostEvent } from "@/components/m3/events";

export function shouldIgnoreEditorNav(target: EventTarget | null) {
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

export function useEditorKeyboardNavigation({
  open,
  game,
  visibleGames,
  onSelect,
}: {
  open: boolean;
  game: GameRecord | null;
  visibleGames: GameRecord[];
  onSelect: (id: string) => void;
}) {
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
}

export function EditorPager({
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

export function EditorMobileNavigation({
  prevGame,
  nextGame,
  index,
  total,
  onSelect,
}: {
  prevGame: GameRecord | null;
  nextGame: GameRecord | null;
  index: number;
  total: number;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="editor-mobile-nav" aria-label="Zwischen Spielen wechseln">
      <m3-icon-button
        aria-label={prevGame ? `Vorheriges Spiel: ${prevGame.name}` : "Kein vorheriges Spiel"}
        disabled={!prevGame}
        onClick={() => prevGame && onSelect(prevGame.id)}
      >
        <IconChevronLeft />
      </m3-icon-button>
      <span>{index + 1} von {total}</span>
      <m3-icon-button
        aria-label={nextGame ? `Nächstes Spiel: ${nextGame.name}` : "Kein nächstes Spiel"}
        disabled={!nextGame}
        onClick={() => nextGame && onSelect(nextGame.id)}
      >
        <IconChevronRight />
      </m3-icon-button>
    </nav>
  );
}
