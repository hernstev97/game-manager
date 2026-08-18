"use client";

import { useEffect, useRef, useState } from "react";
import { sortableFieldOptions } from "@/lib/game-fields";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import { IconArrowDown, IconArrowUp, IconCheck, IconClose, IconDownload, IconSearch, IconSettings, IconUpload } from "@/components/m3/icons";
import { M3SearchBar, M3SplitButton } from "@/components/m3/host";

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
  totalCount?: number;
  onQuery: (query: string) => void;
  onSort: (sort: SortState) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSettings: () => void;
}) {
  const [draft, setDraft] = useState(query);
  const fileRef = useRef<HTMLInputElement>(null);
  const options = sortableFieldOptions();
  const label = SORT_LABEL_OVERRIDES[sort.by] ?? options.find((item) => item.id === sort.by)?.label ?? sort.by;

  useEffect(() => {
    const handle = window.setTimeout(() => onQuery(draft), 150);
    return () => window.clearTimeout(handle);
  }, [draft, onQuery]);

  return (
    <div className="library-tools">
      <M3SearchBar
        value={draft}
        onChange={setDraft}
        placeholder="Bibliothek durchsuchen…"
        label="Suchen"
      >
        <IconSearch slot="leading" />
        {draft ? (
          <m3-icon-button
            slot="trailing"
            size="small"
            aria-label="Suche löschen"
            onClick={() => {
              setDraft("");
              onQuery("");
            }}
          >
            <IconClose width={18} height={18} />
          </m3-icon-button>
        ) : null}
      </M3SearchBar>

      <M3SplitButton
        variant="tonal"
        menuLabel="Sortierkriterium wählen"
        onMainClick={() => onSort({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
        onSelect={(by) => onSort({ by, dir: sort.dir })}
      >
        {sort.dir === "asc" ? <IconArrowUp width={18} height={18} /> : <IconArrowDown width={18} height={18} />}
        {label}
        <m3-menu slot="menu" placement="bottom-end">
          {options.map((option) => (
            <m3-menu-item key={option.id} value={option.id}>
              {SORT_LABEL_OVERRIDES[option.id] ?? option.label}
              {sort.by === option.id ? <IconCheck slot="trailing-icon" /> : null}
            </m3-menu-item>
          ))}
        </m3-menu>
      </M3SplitButton>

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
      <m3-tooltip text="Importieren">
        <m3-icon-button aria-label="Importieren" onClick={() => fileRef.current?.click()}>
          <IconUpload />
        </m3-icon-button>
      </m3-tooltip>
      <m3-tooltip text="Exportieren">
        <m3-icon-button aria-label="Exportieren" onClick={onExport}>
          <IconDownload />
        </m3-icon-button>
      </m3-tooltip>
      <m3-tooltip text="Einstellungen">
        <m3-icon-button aria-label="Einstellungen" onClick={onSettings}>
          <IconSettings />
        </m3-icon-button>
      </m3-tooltip>
    </div>
  );
}

export function filtersWithQuery(filters: LibraryFilters, query: string): LibraryFilters {
  return { ...filters, query };
}
