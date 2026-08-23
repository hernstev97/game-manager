"use client";

import type { RefObject } from "react";
import type { SortState } from "@/lib/filter-games";
import { DesktopLibraryActions } from "@/components/library/DesktopLibraryActions";

export function LibraryActions({
  sort,
  onSort,
  fileRef,
  onExport,
  onSettings,
}: {
  sort: SortState;
  onSort: (sort: SortState) => void;
  fileRef: RefObject<HTMLInputElement | null>;
  onExport: () => void;
  onSettings: () => void;
}) {
  return (
    <DesktopLibraryActions
      sort={sort}
      onSort={onSort}
      fileRef={fileRef}
      onExport={onExport}
      onSettings={onSettings}
    />
  );
}
