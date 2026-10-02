"use client";

import { useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import type { FranchisePresentation } from "@/lib/model/shared";
import type { DisplayMode, GroupByMode, SavedView } from "@/lib/model/views";
import { IconAdd, IconSettings } from "@/components/m3/icons";
import { AppNavigation } from "@/components/shell/AppNavigation";
import { FilterBar, fieldFilterCount } from "@/components/filters/FilterBar";
import { LibraryCollection } from "@/components/library/LibraryCollection";
import { LibraryResultsBar } from "@/components/library/LibraryResultsBar";
import { LibrarySearchField } from "@/components/library/LibrarySearchField";
import { LibraryViewsController } from "@/components/views";
import {
  FavoriteRankingView,
  QueueView,
  type PlanningMode,
  type QueueInsertion,
} from "@/components/planning";
import { LibraryJobCenter } from "@/components/library/LibraryJobCenter";
import { SaveStatusIndicator } from "@/components/save-status";

const DESTINATION_TITLES: Record<PlanningMode, string> = {
  library: "Bibliothek",
  queue: "Als Nächstes",
  favorites: "Ranking",
};

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
  searchEpoch,
  onQuery,
  onSort,
  onSavedViews,
  onSelectView,
  onDisplayMode,
  onGroupBy,
  onSelectionMode,
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
  searchEpoch: number;
  onQuery: (query: string) => void;
  onSort: (sort: SortState) => void;
  onSavedViews: (views: readonly SavedView[], defaultView?: string) => void;
  onSelectView: (id: string) => void;
  onDisplayMode: (mode: DisplayMode) => void;
  onGroupBy: (groupBy: GroupByMode) => void;
  onSelectionMode: (enabled: boolean) => void;
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
  onQueueInsert: (gameId: string, placement: QueueInsertion) => void;
  onQueueRemove: (gameId: string) => void;
  onQueueReorder: (orderedIds: readonly string[]) => void;
  onFavoriteRank: (gameId: string, rank: number) => void;
  onFavoriteRemove: (gameId: string) => void;
  onFavoriteReorder: (orderedIds: readonly string[]) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <AppNavigation
        value={planningMode}
        onChange={onPlanningMode}
        onAdd={onOpenAdd}
        onSettings={onSettings}
        disabled={selectionMode}
      />
      <div className={`app-main${selectionMode ? " is-selection-mode" : ""}`}>
        <header className="app-header">
          {planningMode === "library" ? (
            <LibrarySearchField
              key={`${activeViewId}:${searchEpoch}`}
              query={filters.query}
              totalCount={games.length}
              filterCount={fieldFilterCount(filters)}
              onQuery={onQuery}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          ) : (
            <h1 className="app-header-title">{DESTINATION_TITLES[planningMode]}</h1>
          )}
          <div className="app-header-actions">
            <SaveStatusIndicator quiet />
            <LibraryJobCenter />
            <m3-icon-button className="compact-only" aria-label="Einstellungen" onClick={onSettings}>
              <IconSettings />
            </m3-icon-button>
          </div>
        </header>
        <main className="library-workspace">
          {planningMode === "queue" ? (
            <QueueView
              games={games}
              onReorder={onQueueReorder}
              onInsert={onQueueInsert}
              onRemove={onQueueRemove}
              onOpenGame={onOpenGame}
            />
          ) : planningMode === "favorites" ? (
            <FavoriteRankingView
              games={games}
              onReorder={onFavoriteReorder}
              onChangeRank={onFavoriteRank}
              onRemoveRank={onFavoriteRemove}
              onOpenGame={onOpenGame}
            />
          ) : (
            <>
              <div className="library-controls">
                <LibraryViewsController
                  views={savedViews}
                  activeViewId={activeViewId}
                  filters={filters}
                  sort={sort}
                  displayMode={displayMode}
                  groupBy={groupBy}
                  disabled={selectionMode}
                  onSelect={onSelectView}
                  onChange={onSavedViews}
                />
                <FilterBar
                  games={games}
                  filters={filters}
                  sheetOpen={filtersOpen}
                  onSheetOpenChange={setFiltersOpen}
                  onChange={onFilterChange}
                />
                <LibraryResultsBar
                  visibleCount={visibleGames.length}
                  totalCount={games.length}
                  sort={sort}
                  displayMode={displayMode}
                  groupBy={groupBy}
                  selectionMode={selectionMode}
                  onSort={onSort}
                  onDisplayMode={onDisplayMode}
                  onGroupBy={onGroupBy}
                  onSelectionMode={onSelectionMode}
                />
              </div>
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
      {!selectionMode && games.length > 0 ? (
        <button type="button" className="app-fab compact-only" aria-label="Spiel hinzufügen" onClick={onOpenAdd}>
          <IconAdd />
        </button>
      ) : null}
    </>
  );
}
