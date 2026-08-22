"use client";

import type { GameRecord } from "@/lib/game-fields";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import type { FranchisePresentation } from "@/lib/model/shared";
import type { DisplayMode, GroupByMode, SavedView } from "@/lib/model/views";
import { IconAdd } from "@/components/m3/icons";
import { LibraryToolbar } from "@/components/library/LibraryToolbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { LibraryCollection } from "@/components/library/LibraryCollection";
import { LibraryViewControls, LibraryViewsController } from "@/components/views";
import {
  FavoriteRankingView,
  PlanningNavigation,
  QueueView,
  type PlanningMode,
  type QueueInsertion,
} from "@/components/planning";

export function LibraryWorkspace({
  games,
  visibleGames,
  filters,
  sort,
  savedViews,
  activeViewId,
  displayMode,
  groupBy,
  franchises,
  selectionMode,
  selectedIds,
  dndDisabled,
  selectedId,
  planningMode,
  queueReorderMode,
  favoriteReorderMode,
  searchEpoch,
  onQuery,
  onSort,
  onSavedViews,
  onSelectView,
  onDisplayMode,
  onGroupBy,
  onSelectionMode,
  onImport,
  onExport,
  onSettings,
  onFilterChange,
  onClearFilters,
  onOpenAdd,
  onOpenGame,
  onSelectGame,
  onToggleSelection,
  onReorder,
  onFranchisePresentation,
  onPlanningMode,
  onQueueReorderMode,
  onFavoriteReorderMode,
  onQueueInsert,
  onQueueRemove,
  onQueueReorder,
  onFavoriteRank,
  onFavoriteRemove,
  onFavoriteReorder,
}: {
  games: GameRecord[];
  visibleGames: GameRecord[];
  filters: LibraryFilters;
  sort: SortState;
  savedViews: SavedView[];
  activeViewId: string;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  franchises: FranchisePresentation[];
  selectionMode: boolean;
  selectedIds: readonly string[];
  dndDisabled: boolean;
  selectedId: string | null;
  planningMode: PlanningMode;
  queueReorderMode: boolean;
  favoriteReorderMode: boolean;
  searchEpoch: number;
  onQuery: (query: string) => void;
  onSort: (sort: SortState) => void;
  onSavedViews: (views: readonly SavedView[], defaultView?: string) => void;
  onSelectView: (id: string) => void;
  onDisplayMode: (mode: DisplayMode) => void;
  onGroupBy: (groupBy: GroupByMode) => void;
  onSelectionMode: (enabled: boolean) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSettings: () => void;
  onFilterChange: (next: LibraryFilters) => void;
  onClearFilters: () => void;
  onOpenAdd: () => void;
  onOpenGame: (id: string) => void;
  onSelectGame: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onFranchisePresentation: (presentation: FranchisePresentation) => void;
  onPlanningMode: (mode: PlanningMode) => void;
  onQueueReorderMode: (active: boolean) => void;
  onFavoriteReorderMode: (active: boolean) => void;
  onQueueInsert: (gameId: string, placement: QueueInsertion) => void;
  onQueueRemove: (gameId: string) => void;
  onQueueReorder: (orderedIds: readonly string[]) => void;
  onFavoriteRank: (gameId: string, rank: number) => void;
  onFavoriteRemove: (gameId: string) => void;
  onFavoriteReorder: (orderedIds: readonly string[]) => void;
}) {
  return (
    <>
      <m3-top-app-bar>
        gGrid
        <m3-button className="desktop-add-action" slot="actions" onClick={onOpenAdd}>
          <IconAdd slot="icon" width={18} height={18} />
          Spiel hinzufügen
        </m3-button>
      </m3-top-app-bar>
      <div className="library-shell">
        <div className="library-layout">
          <LibraryViewsController
            views={savedViews}
            activeViewId={activeViewId}
            filters={filters}
            sort={sort}
            displayMode={displayMode}
            groupBy={groupBy}
            onSelect={onSelectView}
            onChange={onSavedViews}
          />
          <main className="library-workspace">
            <PlanningNavigation
              value={planningMode}
              onChange={onPlanningMode}
              disabled={selectionMode}
            />
            {planningMode === "queue" ? (
              <QueueView
                games={games}
                reorderMode={queueReorderMode}
                onReorderModeChange={onQueueReorderMode}
                onReorder={onQueueReorder}
                onInsert={onQueueInsert}
                onRemove={onQueueRemove}
                onOpenGame={onOpenGame}
              />
            ) : planningMode === "favorites" ? (
              <FavoriteRankingView
                games={games}
                reorderMode={favoriteReorderMode}
                onReorderModeChange={onFavoriteReorderMode}
                onReorder={onFavoriteReorder}
                onChangeRank={onFavoriteRank}
                onRemoveRank={onFavoriteRemove}
                onOpenGame={onOpenGame}
              />
            ) : (
              <>
                <LibraryToolbar
                  key={searchEpoch}
                  query={filters.query}
                  sort={sort}
                  totalCount={games.length}
                  onQuery={onQuery}
                  onSort={onSort}
                  onImport={onImport}
                  onExport={onExport}
                  onSettings={onSettings}
                />
                <FilterBar
                  games={games}
                  filters={filters}
                  visibleCount={visibleGames.length}
                  onChange={onFilterChange}
                  onClear={onClearFilters}
                />
                <LibraryViewControls
                  displayMode={displayMode}
                  groupBy={groupBy}
                  selectionMode={selectionMode}
                  onDisplayMode={onDisplayMode}
                  onGroupBy={onGroupBy}
                  onSelectionMode={onSelectionMode}
                />
                <m3-divider />
                <LibraryCollection
                  games={visibleGames}
                  libraryEmpty={games.length === 0}
                  displayMode={displayMode}
                  groupBy={groupBy}
                  franchises={franchises}
                  selectedId={selectedId}
                  sortByQueue={sort.by === "priority" || sort.by === "queuePosition"}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  dndDisabled={dndDisabled}
                  onOpen={onOpenGame}
                  onSelect={onSelectGame}
                  onToggleSelection={onToggleSelection}
                  onSelectionMode={onSelectionMode}
                  onReorder={onReorder}
                  onAdd={onOpenAdd}
                  onClearFilters={onClearFilters}
                  onFranchisePresentation={onFranchisePresentation}
                />
              </>
            )}
          </main>
        </div>
      </div>
      {!selectionMode ? (
        <m3-button className="mobile-add-fab" aria-label="Spiel hinzufügen" onClick={onOpenAdd}>
          <IconAdd slot="icon" width={20} height={20} />
          Spiel
        </m3-button>
      ) : null}
    </>
  );
}
