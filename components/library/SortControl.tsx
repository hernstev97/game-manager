"use client";

import { sortableFieldOptions } from "@/lib/game-fields";
import type { SortState } from "@/lib/filter-games";
import { IconArrowDown, IconArrowUp, IconCheck } from "@/components/m3/icons";
import { M3SplitButton } from "@/components/m3/host";

export const SORT_LABEL_OVERRIDES: Record<string, string> = {
  name: "Alphabetisch",
  priority: "Als nächstes",
  rating: "Bewertung",
  difficultyTo100: "Schwierigkeit",
  franchise: "Franchise",
  dateAdded: "Hinzugefügt",
  playtimeMinutes: "Spielzeit",
  steamPrice: "Steam-Preis",
  status: "Status",
};

export function SortControl({
  sort,
  onSort,
  placement,
}: {
  sort: SortState;
  onSort: (sort: SortState) => void;
  placement: "bottom-start" | "bottom-end";
}) {
  const options = sortableFieldOptions();
  const label =
    SORT_LABEL_OVERRIDES[sort.by] ?? options.find((item) => item.id === sort.by)?.label ?? sort.by;

  return (
    <M3SplitButton
      variant="tonal"
      menuLabel="Sortierkriterium wählen"
      onMainClick={() => onSort({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
      onSelect={(by) => onSort({ by, dir: sort.dir })}
    >
      {sort.dir === "asc" ? <IconArrowUp width={18} height={18} /> : <IconArrowDown width={18} height={18} />}
      {label}
      <m3-menu slot="menu" placement={placement}>
        {options.map((option) => (
          <m3-menu-item key={option.id} value={option.id}>
            {SORT_LABEL_OVERRIDES[option.id] ?? option.label}
            {sort.by === option.id ? <IconCheck slot="trailing-icon" /> : null}
          </m3-menu-item>
        ))}
      </m3-menu>
    </M3SplitButton>
  );
}
