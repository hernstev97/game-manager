"use client";

import { useMemo, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import {
  activeFilterChips,
  emptyFieldFilter,
  isFilterActive,
  type FieldFilterValue,
  type LibraryFilters,
} from "@/lib/filter-games";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { FilterGroupMenu } from "@/components/filters/FilterGroupMenu";
import {
  fieldForFilter,
  filterGroupsForGames,
  type FilterGroup,
} from "@/components/filters/filter-logic";
import { FilterSummary } from "@/components/filters/FilterSummary";
import { RecentFilterPresets } from "@/components/filters/RecentFilterPresets";
import {
  emptyMobileFilters,
  MobileActiveFilters,
  MobileFilterSheet,
} from "@/components/filters/MobileFilterSheet";
import {
  MobileLibraryCommandBar,
  type MobileLibraryCommandBarProps,
} from "@/components/library/MobileLibraryCommandBar";
import { recordRecentFilterPreset } from "@/lib/recent-filters";

type MobileControls = Omit<
  MobileLibraryCommandBarProps,
  "visibleCount" | "totalCount" | "fieldFilterCount" | "onOpenFilters"
>;

export function FilterBar({
  games,
  filters,
  visibleCount,
  mobileControlsKey,
  mobileControls,
  onChange,
  onClear,
}: {
  games: GameRecord[];
  filters: LibraryFilters;
  visibleCount: number;
  mobileControlsKey: string;
  mobileControls: MobileControls;
  onChange: (next: LibraryFilters) => void;
  onClear: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const groups = useMemo<FilterGroup[]>(() => filterGroupsForGames(games), [games]);
  const chips = activeFilterChips(filters);
  const fieldChips = chips.filter((chip) => chip.fieldId !== "query");
  const active = isFilterActive(filters);

  const commitFilters = (next: LibraryFilters) => {
    onChange(next);
    recordRecentFilterPreset(next);
  };

  const setField = (fieldId: string, value: FieldFilterValue) => {
    commitFilters({
      ...filters,
      fields: { ...filters.fields, [fieldId]: value },
    });
  };

  const setDraftField = (fieldId: string, value: FieldFilterValue) => {
    setDraftFilters((current) => ({
      ...current,
      fields: { ...current.fields, [fieldId]: value },
    }));
  };

  const openMobileFilters = () => {
    setDraftFilters(filters);
    setMobileOpen(true);
  };

  const dismissChip = (fieldId: string, token: string) => {
    if (fieldId === "query") {
      onChange({ ...filters, query: "" });
      return;
    }
    const field = fieldForFilter(fieldId);
    const current = filters.fields[fieldId] ?? (field ? emptyFieldFilter(field) : undefined);
    if (!current) return;
    if (current.kind === "toggle") {
      setField(fieldId, { ...current, on: false });
      return;
    }
    setField(fieldId, {
      ...current,
      selected: current.selected.filter((item) => item !== token),
    } as FieldFilterValue);
  };

  return (
    <section className="filter-bar" aria-label="Filter">
      <MobileLibraryCommandBar
        key={mobileControlsKey}
        {...mobileControls}
        visibleCount={visibleCount}
        totalCount={games.length}
        fieldFilterCount={fieldChips.length}
        onOpenFilters={openMobileFilters}
      />
      <FilterSummary visibleCount={visibleCount} totalCount={games.length} />
      <div className="desktop-recent-filters">
        <RecentFilterPresets query={filters.query} onApply={commitFilters} />
      </div>
      <FilterGroupMenu games={games} filters={filters} groups={groups} onChange={commitFilters} />
      <ActiveFilterChips
        active={active}
        chips={chips}
        onDismiss={dismissChip}
        onClear={onClear}
      />
      <MobileActiveFilters
        fieldChips={fieldChips}
        onDismiss={dismissChip}
        onClear={() => onChange(emptyMobileFilters(filters.query))}
      />
      <MobileFilterSheet
        open={mobileOpen}
        games={games}
        draftFilters={draftFilters}
        groups={groups}
        onClose={() => setMobileOpen(false)}
        onDraftField={setDraftField}
        onReset={() => setDraftFilters(emptyMobileFilters(filters.query))}
        onApply={() => {
          commitFilters(draftFilters);
          setMobileOpen(false);
        }}
        recentFilters={(
          <RecentFilterPresets
            query={filters.query}
            onApply={(next) => {
              commitFilters(next);
              setMobileOpen(false);
            }}
          />
        )}
      />
    </section>
  );
}
