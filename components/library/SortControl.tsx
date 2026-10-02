"use client";

import { useState } from "react";
import { sortableFieldOptions } from "@/lib/game-fields";
import type { SortState } from "@/lib/filter-games";
import { IconArrowDown, IconArrowUp, IconCheck, IconExpandMore } from "@/components/m3/icons";
import { M3Menu } from "@/components/m3/host";

export const SORT_LABEL_OVERRIDES: Record<string, string> = {
  name: "Alphabetisch",
  priority: "Als Nächstes",
  queuePosition: "Als Nächstes",
  favoriteRank: "Ranking",
  rating: "Bewertung",
  difficultyTo100: "Schwierigkeit",
  franchise: "Franchise",
  dateAdded: "Hinzugefügt",
  playtimeMinutes: "Spielzeit",
  steamPrice: "Steam-Preis",
  status: "Status",
};

/** Compact sort field menu plus a direction toggle. */
export function SortControl({
  sort,
  onSort,
  placement,
}: {
  sort: SortState;
  onSort: (sort: SortState) => void;
  placement: "bottom-start" | "bottom-end";
}) {
  const [open, setOpen] = useState(false);
  const options = sortableFieldOptions();
  const label =
    SORT_LABEL_OVERRIDES[sort.by] ?? options.find((item) => item.id === sort.by)?.label ?? sort.by;
  const ascending = sort.dir === "asc";

  return (
    <div className="sort-control">
      <div className="anchor">
        <button
          type="button"
          className="sort-menu-button"
          aria-label="Sortierkriterium wählen"
          aria-haspopup="menu"
          aria-expanded={open}
          title={`Sortiert nach ${label}`}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sort-menu-label">{label}</span>
          <IconExpandMore width={18} height={18} />
        </button>
        <M3Menu
          open={open}
          placement={placement}
          onOpenChange={setOpen}
          onSelect={(by) => {
            setOpen(false);
            onSort({ by, dir: sort.dir });
          }}
        >
          {options.map((option) => (
            <m3-menu-item key={option.id} value={option.id}>
              {SORT_LABEL_OVERRIDES[option.id] ?? option.label}
              {sort.by === option.id ? <IconCheck slot="trailing-icon" /> : null}
            </m3-menu-item>
          ))}
        </M3Menu>
      </div>
      <button
        type="button"
        className="icon-toggle"
        aria-label={ascending ? "Aufsteigend sortiert – umkehren" : "Absteigend sortiert – umkehren"}
        title={ascending ? "Aufsteigend" : "Absteigend"}
        onClick={() => onSort({ ...sort, dir: ascending ? "desc" : "asc" })}
      >
        {ascending ? <IconArrowUp /> : <IconArrowDown />}
      </button>
    </div>
  );
}
