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
import {
  emptyMobileFilters,
  MobileActiveFilters,
  MobileFilterOverview,
  MobileFilterSheet,
} from "@/components/filters/MobileFilterSheet";

export function FilterBar({
  games,
  filters,
  visibleCount,
  onChange,
  onClear,
}: {
  games: GameRecord[];
  filters: LibraryFilters;
  visibleCount: number;
  onChange: (next: LibraryFilters) => void;
  onClear: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const groups = useMemo<FilterGroup[]>(() => filterGroupsForGames(games), [games]);
  const chips = activeFilterChips(filters);
  const fieldChips = chips.filter((chip) => chip.fieldId !== "query");
  const active = isFilterActive(filters);

  const setField = (fieldId: string, value: FieldFilterValue) => {
    onChange({
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
      <FilterSummary visibleCount={visibleCount} totalCount={games.length} />
      <MobileFilterOverview
        visibleCount={visibleCount}
        totalCount={games.length}
        fieldChipCount={fieldChips.length}
        onOpen={openMobileFilters}
      />
      <FilterGroupMenu games={games} filters={filters} groups={groups} onChange={onChange} />
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
          onChange(draftFilters);
          setMobileOpen(false);
        }}
      />
    </section>
  );
}
