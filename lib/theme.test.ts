import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_SEED,
  generateThemePair,
  normalizeHexColor,
  themeSwatch,
} from "./theme";

describe("theme engine", () => {
  it("builds a complete light/dark token pair from a seed", () => {
    const pair = generateThemePair(DEFAULT_THEME_SEED, "tonalSpot");
    expect(normalizeHexColor(pair.light["--color-primary"])).toMatch(/^#[0-9A-F]{6}$/);
    expect(pair.light["--color-page"]).not.toBe(pair.dark["--color-page"]);
    expect(themeSwatch(pair)).toHaveLength(4);
    expect(pair.light["--color-error"]).toBeTruthy();
  });
});
