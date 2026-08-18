"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Download,
  Search,
  Settings,
  Sparkles,
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
  totalCount,
  onQuery,
  onSort,
  onImport,
  onExport,
  onSettings,
}: {
  query: string;
  sort: SortState;
  totalCount?: number;
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
      <div className="toolbar-brand">
        <span className="brand-mark" aria-hidden="true">
          <Sparkles size={18} strokeWidth={2.4} />
        </span>
        <div className="toolbar-title">
          <div className="toolbar-kicker">DEINE BIBLIOTHEK</div>
          <div className="toolbar-title-row">
            <h1>gGrid</h1>
            {typeof totalCount === "number" ? (
              <span className="m3e-scallop-badge">
                <svg className="scallop-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.4 6.8L19.6 4.4L18.4 9.8L23.4 12L18.4 14.2L19.6 19.6L12 22L9.6 17.2L4.4 19.6L5.6 14.2L0.6 12L5.6 9.8L4.4 4.4L9.6 6.8L12 2Z" />
                </svg>
                <strong>{totalCount}</strong>
                <span>Spiele</span>
              </span>
            ) : null}
          </div>
          <p>Game. Manage. Learn.</p>
        </div>
      </div>

      <div className="toolbar-controls">
        <label className="search-field">
          <Search size={18} />
          <input
            type="search"
            value={draft}
            placeholder="Bibliothek durchsuchen…"
            aria-label="Suchen"
            onChange={(event) => setDraft(event.target.value)}
          />
          {draft ? (
            <button
              type="button"
              className="search-clear-btn"
              aria-label="Suche löschen"
              onClick={(e) => {
                e.preventDefault();
                setDraft("");
                onQuery("");
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <span className="search-shortcut-badge" title="Drücke / zum Suchen">/</span>
          )}
        </label>

        <div className={cn("split-button", open && "is-open")}>
          <button
            type="button"
            className="split-button-lead"
            onClick={() => onSort({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
            aria-label={`${label}, ${sort.dir === "asc" ? "aufsteigend" : "absteigend"}. Klicken, um die Richtung zu wechseln.`}
            title={sort.dir === "asc" ? "Aufsteigend — klicken für absteigend" : "Absteigend — klicken für aufsteigend"}
          >
            {sort.dir === "asc" ? <ArrowUp size={18} strokeWidth={2.5} /> : <ArrowDown size={18} strokeWidth={2.5} />}
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
            <ChevronDown size={20} strokeWidth={2.5} />
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
                <span>{SORT_LABEL_OVERRIDES[option.id] ?? option.label}</span>
                {sort.by === option.id ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </button>
            ))}
          </Popover>
        </div>

        <div className="toolbar-quick-actions">
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
        </div>
      </div>
    </header>
  );
}

export function filtersWithQuery(filters: LibraryFilters, query: string): LibraryFilters {
  return { ...filters, query };
}
