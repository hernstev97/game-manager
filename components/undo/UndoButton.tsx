"use client";

import { undoLatestLibraryChange } from "./library-undo";

export function UndoButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <m3-button variant="text" disabled={disabled} onClick={undoLatestLibraryChange}>
      Letzte Änderung rückgängig
    </m3-button>
  );
}
