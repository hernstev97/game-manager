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
import { TextButton } from "@/components/ui";
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
      <div className="empty-state">
        <div className="empty-mark" aria-hidden="true" />
        <h2>Keine Treffer</h2>
        <p>Kein Spiel passt zu den aktuellen Filtern.</p>
        <TextButton onClick={onClearFilters}>Filter zurücksetzen</TextButton>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={games.map((game) => game.id)} strategy={verticalListSortingStrategy}>
        <div className="game-list" role="listbox" aria-label="Spiele">
          {games.map((game) => (
            <GameRow
              key={game.id}
              game={game}
              selected={game.id === selectedId}
              draggingEnabled={sortByPriority}
              onOpen={() => onOpen(game.id)}
              onSelect={() => onSelect(game.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
