import { describe, expect, it } from "vitest";
import {
  GAME_FIELDS,
  editorFields,
  filterableFields,
  fieldById,
  sortableFieldOptions,
} from "./game-fields";

describe("field registry", () => {
  it("drives filters, editor, and sort without hardcoded field lists", () => {
    expect(filterableFields().map((field) => field.id)).toContain("franchise");
    expect(filterableFields().map((field) => field.id)).toContain("difficultyTo100");
    expect(editorFields().every((field) => field.showInEditor)).toBe(true);
    expect(sortableFieldOptions().some((item) => item.id === "name")).toBe(true);
    expect(fieldById("rating")?.type).toBe("rating");
    expect(GAME_FIELDS.some((field) => field.id === "name")).toBe(true);
  });
});
