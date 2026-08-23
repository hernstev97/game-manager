"use client";

import { useEffect } from "react";

export type SelectionEscapeDecision = {
  key: string;
  selectionMode: boolean;
  defaultPrevented?: boolean;
  editableTarget?: boolean;
};

export function shouldExitSelectionOnEscape({
  key,
  selectionMode,
  defaultPrevented = false,
  editableTarget = false,
}: SelectionEscapeDecision): boolean {
  return key === "Escape" && selectionMode && !defaultPrevented && !editableTarget;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "M3-TEXT-FIELD", "M3-SEARCH-BAR"].includes(target.tagName)
  );
}

export function useSelectionEscape(selectionMode: boolean, onExit: () => void): void {
  useEffect(() => {
    if (!selectionMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !shouldExitSelectionOnEscape({
          key: event.key,
          selectionMode,
          defaultPrevented: event.defaultPrevented,
          editableTarget: isEditableTarget(event.target),
        })
      ) {
        return;
      }
      event.preventDefault();
      onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit, selectionMode]);
}
