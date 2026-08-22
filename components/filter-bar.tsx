"use client";

import { useMemo, useState } from "react";
import {
  collectFilterOptions,
  fieldById,
  filterableFields,
  type AnyGameField,
  type GameRecord,
} from "@/lib/game-fields";
import {
  activeFilterChips,
  applyFiltersAndSort,
  EMPTY_FILTERS,
  emptyFieldFilter,
  isFilterActive,
  type FieldFilterValue,
  type LibraryFilters,
} from "@/lib/filter-games";
import { IconCheck, IconTune } from "@/components/m3/icons";
import { M3Chip, M3Dialog, M3Menu, M3Slider } from "@/components/m3/host";

type FilterGroup = {
  key: string;
  label: string;
  fields: AnyGameField[];
};

function groupFilterFields(fields: AnyGameField[]): FilterGroup[] {
  const groups: FilterGroup[] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    const key = field.filterGroup ?? field.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const members = field.filterGroup
      ? fields.filter((item) => item.filterGroup === field.filterGroup)
      : [field];
    groups.push({
      key,
      label: field.filterGroupLabel ?? field.label,
      fields: members,
    });
  }
  return groups;
}

function groupActiveCount(group: FilterGroup, filters: LibraryFilters): number {
  let count = 0;
  for (const field of group.fields) {
    const value = filters.fields[field.id];
    if (!value) continue;
    if (value.kind === "toggle" && value.on) count++;
    if (value.kind === "multi") count += value.selected.length;
    if (value.kind === "rating") count += value.selected.length;
    if (value.kind === "priority") count += value.selected.length;
  }
  return count;
}

function menuChoices(field: AnyGameField, games: GameRecord[]): Array<{ token: string; label: string }> {
  if (field.type === "text" || field.filterWidget === "toggle") {
    return [{ token: "on", label: field.filterTrueLabel ?? field.label }];
  }
  if (field.type === "rating") {
    return [
      { token: "rated", label: "Bewertet" },
      { token: "unrated", label: "Unbewertet" },
      { token: "gte", label: "Mindestbewertung" },
    ];
  }
  if (field.type === "priority") {
    return [
      { token: "has", label: "Hat Priorität" },
      { token: "top5", label: "Top 5" },
      { token: "none", label: "Ohne Rang" },
    ];
  }
  if (field.type === "boolean") {
    return [
      { token: "true", label: field.filterTrueLabel ?? field.label },
      { token: "false", label: field.filterFalseLabel ?? `Nicht ${field.label}` },
    ];
  }
  return collectFilterOptions(field, games).map((option) => ({ token: option, label: option }));
}

function isTokenSelected(value: FieldFilterValue | undefined, token: string): boolean {
  if (!value) return false;
  if (value.kind === "toggle") return token === "on" && value.on;
  return value.selected.includes(token as never);
}

function toggleToken(field: AnyGameField, value: FieldFilterValue | undefined, token: string): FieldFilterValue {
  const current = value ?? emptyFieldFilter(field);
  if (current.kind === "toggle") {
    return { ...current, on: !current.on };
  }
  const selected = current.selected.includes(token as never)
    ? current.selected.filter((item) => item !== token)
    : [...current.selected, token];
  return { ...current, selected } as FieldFilterValue;
}

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
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const groups = useMemo(
    () =>
      groupFilterFields(filterableFields()).filter((group) =>
        group.fields.some((field) => menuChoices(field, games).length > 0),
      ),
    [games],
  );
  const chips = activeFilterChips(filters);
  const fieldChips = chips.filter((chip) => chip.fieldId !== "query");
  const active = isFilterActive(filters);
  const rating = filters.fields.rating?.kind === "rating" ? filters.fields.rating : null;
  const draftRating =
    draftFilters.fields.rating?.kind === "rating" ? draftFilters.fields.rating : null;
  const draftVisibleCount = useMemo(
    () => applyFiltersAndSort(games, draftFilters, { by: "name", dir: "asc" }).length,
    [games, draftFilters],
  );

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
    const field = fieldById(fieldId);
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
      <div className="filter-count desktop-filter-count" aria-live="polite">
        {visibleCount} von {games.length} sichtbar
      </div>
      <div className="mobile-filter-overview">
        <span className="filter-count" aria-live="polite">
          {visibleCount === games.length ? `${games.length} Spiele` : `${visibleCount} von ${games.length}`}
        </span>
        <m3-button variant={fieldChips.length > 0 ? "tonal" : "outlined"} onClick={openMobileFilters}>
          <IconTune slot="icon" width={18} height={18} />
          Filter{fieldChips.length > 0 ? ` (${fieldChips.length})` : ""}
        </m3-button>
      </div>

      <div className="chip-row desktop-filter-groups">
        {groups.map((group) => {
          const activeCount = groupActiveCount(group, filters);
          const isOpen = openKey === group.key;
          return (
            <div key={group.key} className="anchor">
              <m3-button
                variant={activeCount > 0 ? "tonal" : "outlined"}
                onClick={() => setOpenKey((current) => (current === group.key ? null : group.key))}
              >
                {group.label}
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </m3-button>
              <M3Menu
                open={isOpen}
                onOpenChange={(open) => {
                  if (!open) setOpenKey((current) => (current === group.key ? null : current));
                }}
                onSelect={(packed) => {
                  const [fieldId, token] = packed.split("\u001f");
                  const field = fieldById(fieldId);
                  if (!field || !token) return;
                  setField(fieldId, toggleToken(field, filters.fields[fieldId], token));
                }}
              >
                {group.fields.flatMap((field) =>
                  menuChoices(field, games).map((choice) => {
                    const selected = isTokenSelected(filters.fields[field.id], choice.token);
                    return (
                      <m3-menu-item key={`${field.id}-${choice.token}`} value={`${field.id}\u001f${choice.token}`}>
                        {choice.label}
                        {selected ? <IconCheck slot="trailing-icon" /> : null}
                      </m3-menu-item>
                    );
                  }),
                )}
              </M3Menu>
            </div>
          );
        })}
      </div>

      {rating?.selected.includes("gte") ? (
        <label className="range-row desktop-rating-range">
          <span>Mindestens</span>
          <M3Slider
            label="Mindestbewertung"
            min={1}
            max={10}
            step={0.5}
            value={rating.gte}
            onChange={(gte) => setField("rating", { ...rating, gte })}
          />
          <strong>{rating.gte}</strong>
        </label>
      ) : null}

      {active ? (
        <div className="active-filters desktop-active-filters">
          {chips.map((chip) => (
            <M3Chip
              key={`${chip.fieldId}-${chip.token}`}
              variant="input"
              removable
              onRemove={() => dismissChip(chip.fieldId, chip.token)}
            >
              {chip.label}
            </M3Chip>
          ))}
          <m3-button variant="text" onClick={onClear}>
            Alle löschen
          </m3-button>
        </div>
      ) : null}

      {fieldChips.length > 0 ? (
        <div className="mobile-active-filters" aria-label="Aktive Filter">
          <div className="mobile-active-filter-scroll">
            {fieldChips.map((chip) => (
              <M3Chip
                key={`${chip.fieldId}-${chip.token}`}
                variant="input"
                removable
                onRemove={() => dismissChip(chip.fieldId, chip.token)}
              >
                {chip.label}
              </M3Chip>
            ))}
          </div>
          <m3-button
            variant="text"
            onClick={() => onChange({ ...EMPTY_FILTERS, query: filters.query })}
          >
            Löschen
          </m3-button>
        </div>
      ) : null}

      {mobileOpen ? <M3Dialog
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        headline="Filter"
        presentation="sheet"
        actions={
          <>
            <m3-button
              slot="actions"
              variant="text"
              onClick={() => setDraftFilters({ ...EMPTY_FILTERS, query: filters.query })}
            >
              Zurücksetzen
            </m3-button>
            <m3-button
              slot="actions"
              onClick={() => {
                onChange(draftFilters);
                setMobileOpen(false);
              }}
            >
              {draftVisibleCount} {draftVisibleCount === 1 ? "Spiel" : "Spiele"} anzeigen
            </m3-button>
          </>
        }
      >
        <div className="mobile-filter-sheet">
          {groups.map((group) => (
            <fieldset key={group.key} className="mobile-filter-group">
              <legend>{group.label}</legend>
              <div className="chip-row">
                {group.fields.flatMap((field) =>
                  menuChoices(field, games).map((choice) => {
                    const selected = isTokenSelected(draftFilters.fields[field.id], choice.token);
                    return (
                      <M3Chip
                        key={`${field.id}-${choice.token}`}
                        variant="filter"
                        selected={selected}
                        onClick={() =>
                          setDraftField(
                            field.id,
                            toggleToken(field, draftFilters.fields[field.id], choice.token),
                          )
                        }
                      >
                        {choice.label}
                      </M3Chip>
                    );
                  }),
                )}
              </div>
              {group.fields.some((field) => field.id === "rating") &&
              draftRating?.selected.includes("gte") ? (
                <label className="range-row mobile-rating-range">
                  <span>Mindestens</span>
                  <M3Slider
                    label="Mindestbewertung"
                    min={1}
                    max={10}
                    step={0.5}
                    value={draftRating.gte}
                    onChange={(gte) => setDraftField("rating", { ...draftRating, gte })}
                  />
                  <strong>{draftRating.gte}</strong>
                </label>
              ) : null}
            </fieldset>
          ))}
        </div>
      </M3Dialog> : null}
    </section>
  );
}
