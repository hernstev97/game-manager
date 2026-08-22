"use client";

import { useRef, type KeyboardEvent } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { GameCoverCard } from "@/components/library-grid/GameCoverCard";
import styles from "./library-grid.module.css";

function directionalTarget(
  buttons: HTMLButtonElement[],
  current: HTMLButtonElement,
  key: string,
): HTMLButtonElement | undefined {
  const origin = current.getBoundingClientRect();
  const ox = origin.left + origin.width / 2;
  const oy = origin.top + origin.height / 2;
  return buttons
    .filter((button) => {
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (key === "ArrowLeft") return x < ox && Math.abs(y - oy) < origin.height / 2;
      if (key === "ArrowRight") return x > ox && Math.abs(y - oy) < origin.height / 2;
      if (key === "ArrowUp") return y < oy;
      return y > oy;
    })
    .sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const ad = Math.hypot(ar.left + ar.width / 2 - ox, ar.top + ar.height / 2 - oy);
      const bd = Math.hypot(br.left + br.width / 2 - ox, br.top + br.height / 2 - oy);
      return ad - bd;
    })[0];
}

export function GameCoverGrid({
  games,
  selectedId = null,
  selectionMode = false,
  selectedIds = [],
  onOpen,
  onSelect,
  onToggleSelection,
  onSelectionModeChange,
}: {
  games: readonly GameRecord[];
  selectedId?: string | null;
  selectionMode?: boolean;
  selectedIds?: readonly string[];
  onOpen: (id: string) => void;
  onSelect?: (id: string) => void;
  onToggleSelection?: (id: string) => void;
  onSelectionModeChange?: (enabled: boolean) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selected = new Set(selectedIds);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "F6" && onSelectionModeChange) {
      event.preventDefault();
      onSelectionModeChange(!selectionMode);
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const current = event.target instanceof HTMLButtonElement && event.target.matches("[data-grid-card]")
      ? event.target
      : null;
    if (!current) return;
    const buttons = [...(gridRef.current?.querySelectorAll<HTMLButtonElement>("[data-grid-card]") ?? [])];
    const target = event.key === "Home"
      ? buttons[0]
      : event.key === "End"
        ? buttons.at(-1)
        : directionalTarget(buttons, current, event.key);
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

  return (
    <div
      ref={gridRef}
      className={styles.grid}
      role="grid"
      aria-label="Spiele als Cover-Raster"
      aria-multiselectable={selectionMode || undefined}
      onKeyDown={onKeyDown}
    >
      {games.map((game) => (
        <div role="row" key={game.id} className={styles.gridCell}>
          <div role="gridcell" aria-selected={selectionMode ? selected.has(game.id) : game.id === selectedId}>
            <GameCoverCard
              game={game}
              selected={selectionMode ? selected.has(game.id) : game.id === selectedId}
              selectionMode={selectionMode}
              onOpen={onOpen}
              onSelect={onSelect}
              onToggleSelection={onToggleSelection}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
