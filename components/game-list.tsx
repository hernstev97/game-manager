"use client";

import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { GameRow } from "@/components/game-row";
import type { GameRecord } from "@/lib/game-fields";

export function GameList({
  games,
  selectedId,
  sortByPriority,
  onOpen,
  onSelect,
  onReorder,
  onClearFilters,
}: {
  games: GameRecord[];
  selectedId: string | null;
  sortByPriority: boolean;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onClearFilters: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const rankedVisibleIds = useMemo(
    () => games.filter((game) => game.priority != null).map((game) => game.id),
    [games],
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rankedVisibleIds.indexOf(String(active.id));
    const newIndex = rankedVisibleIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(rankedVisibleIds, oldIndex, newIndex));
  };

  if (games.length === 0) {
    return (
      <m3-card variant="outlined" className="empty-state">
        <h2 slot="header">Keine Treffer</h2>
        <p>Kein Spiel passt zu den aktuellen Filtern.</p>
        <m3-button slot="actions" variant="text" onClick={onClearFilters}>
          Filter zurücksetzen
        </m3-button>
      </m3-card>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={games.map((game) => game.id)} strategy={verticalListSortingStrategy}>
        <m3-list className="game-list" aria-label="Spiele">
          {games.map((game, index) => (
            <GameRow
              key={game.id}
              game={game}
              index={index}
              selected={game.id === selectedId}
              draggingEnabled={sortByPriority}
              onOpen={() => onOpen(game.id)}
              onSelect={() => onSelect(game.id)}
            />
          ))}
        </m3-list>
      </SortableContext>
    </DndContext>
  );
}
