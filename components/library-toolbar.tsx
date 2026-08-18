"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Download,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import { sortableFieldOptions } from "@/lib/game-fields";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import { IconButton, Popover } from "@/components/ui";
import { cn } from "@/lib/cn";

const SORT_LABEL_OVERRIDES: Record<string, string> = {
  name: "Alphabetisch",
  priority: "Als nächstes",
  rating: "Bewertung",
  difficultyTo100: "Schwierigkeit",
  franchise: "Franchise",
  dateAdded: "Hinzugefügt",
  playtimeMinutes: "Spielzeit",
  status: "Status",
};

export function LibraryToolbar({
  query,
  sort,
  onQuery,
  onSort,
  onImport,
  onExport,
  onSettings,
}: {
  query: string;
  sort: SortState;
  onQuery: (query: string) => void;
  onSort: (sort: SortState) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSettings: () => void;
}) {
  const [draft, setDraft] = useState(query);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const options = sortableFieldOptions();
  const label = SORT_LABEL_OVERRIDES[sort.by] ?? options.find((item) => item.id === sort.by)?.label ?? sort.by;

  useEffect(() => {
    const handle = window.setTimeout(() => onQuery(draft), 150);
    return () => window.clearTimeout(handle);
  }, [draft, onQuery]);

  return (
    <header className="library-toolbar">
      <div className="toolbar-title">
        <h1>Bibliothek</h1>
        <p>Persönliche Sammlung, Filter zuerst.</p>
      </div>

      <label className="search-field">
        <Search size={16} />
        <input
          type="search"
          value={draft}
          placeholder="Suchen…"
          aria-label="Suchen"
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>

      <div className={cn("split-button", open && "is-open")}>
        <button
          type="button"
          className="split-button-lead"
          onClick={() => onSort({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
          aria-label={`${label}, ${sort.dir === "asc" ? "aufsteigend" : "absteigend"}. Klicken, um die Richtung zu wechseln.`}
          title={sort.dir === "asc" ? "Aufsteigend — klicken für absteigend" : "Absteigend — klicken für aufsteigend"}
        >
          {sort.dir === "asc" ? <ArrowUp size={18} strokeWidth={2.25} /> : <ArrowDown size={18} strokeWidth={2.25} />}
          <span>{label}</span>
        </button>
        <button
          type="button"
          className="split-button-trail"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Sortierkriterium wählen"
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown size={20} strokeWidth={2.25} />
        </button>
        <Popover open={open} onClose={() => setOpen(false)} className="sort-menu">
          <div className="sort-menu-label">Sortieren nach</div>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={sort.by === option.id}
              className={cn("menu-item", sort.by === option.id && "is-active")}
              onClick={() => {
                onSort({
                  by: option.id,
                  dir: sort.dir,
                });
                setOpen(false);
              }}
            >
              {SORT_LABEL_OVERRIDES[option.id] ?? option.label}
            </button>
          ))}
        </Popover>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = "";
        }}
      />
      <IconButton label="Importieren" onClick={() => fileRef.current?.click()}>
        <Upload size={18} />
      </IconButton>
      <IconButton label="Exportieren" onClick={onExport}>
        <Download size={18} />
      </IconButton>
      <IconButton label="Einstellungen" onClick={onSettings}>
        <Settings size={18} />
      </IconButton>
    </header>
  );
}

export function filtersWithQuery(filters: LibraryFilters, query: string): LibraryFilters {
  return { ...filters, query };
}
