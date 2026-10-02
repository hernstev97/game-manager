"use client";

import { useEffect, useState } from "react";
import { IconClose, IconSearch, IconTune } from "@/components/m3/icons";
import { M3SearchBar } from "@/components/m3/host";

/** Debounced library search with the filter sheet trigger as trailing action. */
export function LibrarySearchField({
  query,
  totalCount,
  filterCount,
  onQuery,
  onOpenFilters,
}: {
  query: string;
  totalCount: number;
  filterCount: number;
  onQuery: (query: string) => void;
  onOpenFilters: () => void;
}) {
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    if (draft === query) return;
    const handle = window.setTimeout(() => onQuery(draft), 150);
    return () => window.clearTimeout(handle);
  }, [draft, onQuery, query]);

  const placeholder = totalCount > 0
    ? `${totalCount} ${totalCount === 1 ? "Spiel" : "Spiele"} durchsuchen`
    : "Bibliothek durchsuchen";

  return (
    <div className="library-search">
      <M3SearchBar value={draft} onChange={setDraft} placeholder={placeholder} label="Bibliothek durchsuchen">
        <IconSearch slot="leading" />
        {draft ? (
          <m3-icon-button
            slot="trailing"
            aria-label="Suche löschen"
            onClick={() => {
              setDraft("");
              onQuery("");
            }}
          >
            <IconClose width={20} height={20} />
          </m3-icon-button>
        ) : null}
        <span slot="trailing" className="search-filter-trigger">
          <m3-icon-button
            aria-label={filterCount > 0 ? `Filter, ${filterCount} aktiv` : "Filter"}
            title="Filter"
            onClick={onOpenFilters}
          >
            <IconTune />
          </m3-icon-button>
          {filterCount > 0 ? (
            <span className="search-filter-badge" aria-hidden="true">{filterCount}</span>
          ) : null}
        </span>
      </M3SearchBar>
    </div>
  );
}

export function filtersWithQuery<T extends { query: string }>(filters: T, query: string): T {
  return { ...filters, query };
}
