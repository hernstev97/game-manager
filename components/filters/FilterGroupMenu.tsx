"use client";

import { useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import {
  groupActiveCount,
  facetChoices,
  isTokenSelected,
  toggleToken,
  resetFilterGroup,
  type FilterGroup,
} from "@/components/filters/filter-logic";
import type { FieldFilterValue, LibraryFilters } from "@/lib/filter-games";
import { IconCheck } from "@/components/m3/icons";
import { M3Menu, M3Slider } from "@/components/m3/host";

export function FilterGroupMenu({
  games,
  filters,
  groups,
  onChange,
}: {
  games: GameRecord[];
  filters: LibraryFilters;
  groups: FilterGroup[];
  onChange: (next: LibraryFilters) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rating = filters.fields.rating?.kind === "rating" ? filters.fields.rating : null;

  const setField = (fieldId: string, value: FieldFilterValue) => {
    onChange({
      ...filters,
      fields: { ...filters.fields, [fieldId]: value },
    });
  };

  return (
    <>
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
                  if (packed === `reset:${group.key}`) {
                    onChange(resetFilterGroup(filters, group));
                    return;
                  }
                  const [fieldId, token] = packed.split("\u001f");
                  const field = groups
                    .flatMap((item) => item.fields)
                    .find((item) => item.id === fieldId);
                  if (!field || !token) return;
                  setField(fieldId, toggleToken(field, filters.fields[fieldId], token));
                }}
              >
                {group.fields.flatMap((field) =>
                  facetChoices(field, games, filters).map((choice) => {
                    const selected = isTokenSelected(filters.fields[field.id], choice.token);
                    return (
                      <m3-menu-item
                        key={`${field.id}-${choice.token}`}
                        value={`${field.id}\u001f${choice.token}`}
                        disabled={choice.count === 0 && !selected}
                      >
                        {choice.label} ({choice.count})
                        {selected ? <IconCheck slot="trailing-icon" /> : null}
                      </m3-menu-item>
                    );
                  }),
                )}
                {activeCount > 0 ? (
                  <m3-menu-item value={`reset:${group.key}`}>Gruppe zurücksetzen</m3-menu-item>
                ) : null}
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
    </>
  );
}
