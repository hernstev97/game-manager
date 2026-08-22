"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import { IconClose, IconSearch } from "@/components/m3/icons";
import { M3SearchBar } from "@/components/m3/host";
import { LibraryActions } from "@/components/library/LibraryActions";

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

      <LibraryActions
        sort={sort}
        onSort={onSort}
        fileRef={fileRef}
        onExport={onExport}
        onSettings={onSettings}
      />
    </div>
  );
}

export function filtersWithQuery(filters: LibraryFilters, query: string): LibraryFilters {
  return { ...filters, query };
}
