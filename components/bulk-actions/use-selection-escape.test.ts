import { describe, expect, it } from "vitest";
import { shouldExitSelectionOnEscape } from "./use-selection-escape";

describe("selection Escape decision", () => {
  it("exits only an active selection with an unclaimed Escape key", () => {
    expect(shouldExitSelectionOnEscape({ key: "Escape", selectionMode: true })).toBe(true);
    expect(shouldExitSelectionOnEscape({ key: "Enter", selectionMode: true })).toBe(false);
    expect(shouldExitSelectionOnEscape({ key: "Escape", selectionMode: false })).toBe(false);
    expect(
      shouldExitSelectionOnEscape({ key: "Escape", selectionMode: true, defaultPrevented: true }),
    ).toBe(false);
  });

  it("lets editable controls consume Escape before selection mode", () => {
    expect(
      shouldExitSelectionOnEscape({ key: "Escape", selectionMode: true, editableTarget: true }),
    ).toBe(false);
  });
});
