"use client";

import type { GameRecord } from "@/lib/game-fields";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import { IconAdd } from "@/components/m3/icons";
import { LibraryToolbar } from "@/components/library/LibraryToolbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { GameList } from "@/components/library/GameList";

export function LibraryWorkspace({
  games,
  visibleGames,
  filters,
  sort,
  selectedId,
  searchEpoch,
  onQuery,
  onSort,
  onImport,
  onExport,
  onSettings,
  onFilterChange,
  onClearFilters,
  onOpenAdd,
  onOpenGame,
  onSelectGame,
  onReorder,
}: {
  games: GameRecord[];
  visibleGames: GameRecord[];
  filters: LibraryFilters;
  sort: SortState;
  selectedId: string | null;
  searchEpoch: number;
  onQuery: (query: string) => void;
  onSort: (sort: SortState) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSettings: () => void;
  onFilterChange: (next: LibraryFilters) => void;
  onClearFilters: () => void;
  onOpenAdd: () => void;
  onOpenGame: (id: string) => void;
  onSelectGame: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
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
        <m3-divider />
        <GameList
          games={visibleGames}
          libraryEmpty={games.length === 0}
          selectedId={selectedId}
          sortByPriority={sort.by === "priority" || sort.by === "queuePosition"}
          onOpen={onOpenGame}
          onSelect={onSelectGame}
          onReorder={onReorder}
          onAdd={onOpenAdd}
          onClearFilters={onClearFilters}
        />
      </div>
      <m3-button className="mobile-add-fab" aria-label="Spiel hinzufügen" onClick={onOpenAdd}>
        <IconAdd slot="icon" width={20} height={20} />
        Spiel
      </m3-button>
    </>
  );
}
