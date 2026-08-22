"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { GameRecord } from "@/lib/game-fields";
import { EmptyLibrary } from "@/components/library/EmptyLibrary";
import { GameRow } from "@/components/library/GameRow";
import { ReorderToolbar } from "@/components/library/ReorderToolbar";

export function GameList({
  games,
  libraryEmpty,
  selectedId,
  sortByPriority,
  compact = false,
  selectionMode = false,
  selectedIds = [],
  dndDisabled = false,
  onOpen,
  onSelect,
  onToggleSelection,
  onReorder,
  onAdd,
  onClearFilters,
}: {
  games: GameRecord[];
  libraryEmpty: boolean;
  selectedId: string | null;
  sortByPriority: boolean;
  compact?: boolean;
  selectionMode?: boolean;
  selectedIds?: readonly string[];
  dndDisabled?: boolean;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleSelection?: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAdd: () => void;
  onClearFilters: () => void;
}) {
  const [reorderMode, setReorderMode] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
      <EmptyLibrary
        libraryEmpty={libraryEmpty}
        onAdd={onAdd}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <>
      {sortByPriority && !dndDisabled && rankedVisibleIds.length > 1 ? (
        <ReorderToolbar
          reorderMode={reorderMode}
          onToggle={() => setReorderMode((current) => !current)}
        />
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={games.map((game) => game.id)} strategy={verticalListSortingStrategy}>
          <m3-list
            className={`game-list${compact ? " is-compact" : ""}`}
            aria-label="Spiele"
            aria-multiselectable={selectionMode || undefined}
          >
            {games.map((game, index) => (
              <GameRow
                key={game.id}
                game={game}
                index={index}
                selected={selectionMode ? selectedIds.includes(game.id) : game.id === selectedId}
                compact={compact}
                selectionMode={selectionMode}
                draggingEnabled={sortByPriority && reorderMode && !dndDisabled}
                onOpen={() => onOpen(game.id)}
                onSelect={() => onSelect(game.id)}
                onToggleSelection={() => onToggleSelection?.(game.id)}
              />
            ))}
          </m3-list>
        </SortableContext>
      </DndContext>
    </>
  );
}
