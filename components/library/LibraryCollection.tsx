"use client";

import type { GameRecord } from "@/lib/game-fields";
import type { DisplayMode, GroupByMode } from "@/lib/model/views";
import type { FranchisePresentation } from "@/lib/model/shared";
import { FranchiseGroups, FranchisePresentationPopover } from "@/components/franchises";
import { GameCoverGrid } from "@/components/library-grid/GameCoverGrid";
import { GameList } from "@/components/library/GameList";

export function LibraryCollection({
  games,
  libraryEmpty,
  displayMode,
  groupBy,
  franchises,
  selectedId,
  sortByQueue,
  selectionMode,
  selectedIds,
  dndDisabled,
  onOpen,
  onSelect,
  onToggleSelection,
  onSelectionMode,
  onReorder,
  onAdd,
  onClearFilters,
  onFranchisePresentation,
}: {
  games: GameRecord[];
  libraryEmpty: boolean;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  franchises: readonly FranchisePresentation[];
  selectedId: string | null;
  sortByQueue: boolean;
  selectionMode: boolean;
  selectedIds: readonly string[];
  dndDisabled: boolean;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSelectionMode: (enabled: boolean) => void;
  onReorder: (orderedIds: string[]) => void;
  onAdd: () => void;
  onClearFilters: () => void;
  onFranchisePresentation: (presentation: FranchisePresentation) => void;
}) {
  const renderItems = (items: readonly GameRecord[]) => displayMode === "grid" ? (
    <GameCoverGrid
      games={items}
      selectedId={selectedId}
      selectionMode={selectionMode}
      selectedIds={selectedIds}
      onOpen={onOpen}
      onSelect={onSelect}
      onToggleSelection={onToggleSelection}
      onSelectionModeChange={onSelectionMode}
    />
  ) : (
    <GameList
      games={[...items]}
      libraryEmpty={libraryEmpty}
      selectedId={selectedId}
      sortByPriority={sortByQueue && groupBy === "none"}
      compact={displayMode === "compact"}
      selectionMode={selectionMode}
      selectedIds={selectedIds}
      dndDisabled={dndDisabled || groupBy !== "none"}
      onOpen={onOpen}
      onSelect={onSelect}
      onToggleSelection={onToggleSelection}
      onReorder={onReorder}
      onAdd={onAdd}
      onClearFilters={onClearFilters}
    />
  );

  if (games.length === 0 || groupBy === "none") return renderItems(games);
  return (
    <FranchiseGroups
      games={games}
      presentations={franchises}
      displayMode={displayMode}
      renderItems={(items) => renderItems(items)}
      renderHeaderActions={(section) => (
        <FranchisePresentationPopover
          franchise={section.name}
          presentation={section.presentation}
          onChange={onFranchisePresentation}
        />
      )}
    />
  );
}
