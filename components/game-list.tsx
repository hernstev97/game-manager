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
import { GameRow } from "@/components/game-row";
import type { GameRecord } from "@/lib/game-fields";
import { IconGrip } from "@/components/m3/icons";

export function GameList({
  games,
  libraryEmpty,
  selectedId,
  sortByPriority,
  onOpen,
  onSelect,
  onReorder,
  onAdd,
  onClearFilters,
}: {
  games: GameRecord[];
  libraryEmpty: boolean;
  selectedId: string | null;
  sortByPriority: boolean;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
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
    if (libraryEmpty) {
      return (
        <m3-card variant="outlined" className="empty-state">
          <h2 slot="header">Noch keine Spiele</h2>
          <p>Lege ein Spiel an oder importiere eine JSON-Sicherung.</p>
          <m3-button slot="actions" onClick={onAdd}>
            Spiel hinzufügen
          </m3-button>
        </m3-card>
      );
    }
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
    <>
      {sortByPriority && rankedVisibleIds.length > 1 ? (
        <div className="reorder-toolbar">
          <span className="settings-copy">
            {reorderMode ? "Ziehe am Griff oder nutze die Pfeiltasten." : "Prioritäten direkt anordnen."}
          </span>
          <m3-button
            variant={reorderMode ? "tonal" : "outlined"}
            onClick={() => setReorderMode((current) => !current)}
          >
            <IconGrip slot="icon" width={18} height={18} />
            {reorderMode ? "Fertig" : "Reihenfolge ändern"}
          </m3-button>
        </div>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={games.map((game) => game.id)} strategy={verticalListSortingStrategy}>
          <m3-list className="game-list" aria-label="Spiele">
            {games.map((game, index) => (
              <GameRow
                key={game.id}
                game={game}
                index={index}
                selected={game.id === selectedId}
                draggingEnabled={sortByPriority && reorderMode}
                onOpen={() => onOpen(game.id)}
                onSelect={() => onSelect(game.id)}
              />
            ))}
          </m3-list>
        </SortableContext>
      </DndContext>
    </>
  );
}
