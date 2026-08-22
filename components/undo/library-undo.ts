"use client";

import { toast } from "@/components/m3/snackbar";
import { libraryUndoHistory } from "@/lib/runtime/library-runtime";
import { libraryRepository } from "@/lib/storage";
import { useLibrary } from "@/store/library";

export function undoLatestLibraryChange(): boolean {
  const current = libraryRepository.load();
  if (!current) {
    toast.error("Der aktuelle Bibliotheksstand konnte nicht gelesen werden.");
    return false;
  }

  try {
    const result = libraryUndoHistory.undo(current);
    if (!result) {
      toast.error("Es gibt keine Änderung zum Rückgängigmachen.");
      return false;
    }
    useLibrary.getState().applyLibraryDocument(result.document);
    toast.success(`${result.transaction.label} rückgängig gemacht.`);
    return true;
  } catch {
    toast.error("Rückgängig ist nicht möglich, weil sich der Bibliotheksstand geändert hat.");
    return false;
  }
}

export function toastWithUndo(message: string): void {
  toast.success(message, {
    actionLabel: "Rückgängig",
    onAction: undoLatestLibraryChange,
  });
}
