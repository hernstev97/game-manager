"use client";

import { useEffect } from "react";
import { applyFiltersAndSort } from "@/lib/filter-games";
import { useLibrary } from "@/store/library";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "M3-TEXT-FIELD" ||
    tag === "M3-SEARCH-BAR" ||
    tag === "M3-SLIDER"
  );
}

export function useLibraryKeyboardShortcuts(
  openAddDialog: () => void,
  onOpenHelp: () => void,
  onOpenQueue: () => void,
) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") (event.target as HTMLElement).blur();
        return;
      }
      const state = useLibrary.getState();
      if (event.key === "?") {
        const dialogOpen = [...document.querySelectorAll<HTMLElement & { open?: boolean }>(
          "m3-dialog, dialog",
        )].some((dialog) => dialog.open || dialog.hasAttribute("open"));
        if (dialogOpen) return;
        event.preventDefault();
        onOpenHelp();
        return;
      }
      const list = applyFiltersAndSort(state.games, state.filters, state.sort);
      if (event.key === "F6") {
        event.preventDefault();
        if (state.selectionMode) state.endSelection();
        else state.startSelection(state.selectedId ?? undefined);
        return;
      }
      if (event.key === "Escape") {
        if (state.selectionMode) {
          state.endSelection();
          return;
        }
        if (state.addOpen) {
          state.setAddOpen(false);
          return;
        }
        if (state.settingsOpen) {
          state.setSettingsOpen(false);
          return;
        }
        if (state.editorOpen) {
          state.closeEditor();
          return;
        }
        state.selectGame(null);
        return;
      }
      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        document.querySelector<HTMLElement>("m3-search-bar")?.focus();
        return;
      }
      if (event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey) {
        openAddDialog();
        return;
      }
      if (event.key.toLowerCase() === "q" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onOpenQueue();
        return;
      }
      if (list.length === 0) return;
      const currentId = state.selectedId;
      const index = Math.max(0, list.findIndex((game) => game.id === currentId));
      if (event.key.toLowerCase() === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        const next = list[Math.min(list.length - 1, (currentId ? index : -1) + 1)];
        if (next) state.selectGame(next.id);
      }
      if (event.key.toLowerCase() === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = list[Math.max(0, (currentId ? index : 0) - 1)];
        if (next) state.selectGame(next.id);
      }
      if (event.key === "Enter" && currentId) {
        if (state.selectionMode) state.toggleSelection(currentId);
        else state.openEditor(currentId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenHelp, onOpenQueue, openAddDialog]);
}
