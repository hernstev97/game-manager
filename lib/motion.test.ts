import { describe, expect, it } from "vitest";
import {
  DEFAULT_MOTION_PREFERENCE,
  normalizeMotionPreference,
  resolveEffectiveMotion,
} from "./motion";

describe("motion preferences", () => {
  it("accepts supported preferences and falls back safely", () => {
    expect(normalizeMotionPreference("expressive")).toBe("expressive");
    expect(normalizeMotionPreference("standard")).toBe("standard");
    expect(normalizeMotionPreference("none")).toBe("none");
    expect(normalizeMotionPreference("unknown")).toBe(DEFAULT_MOTION_PREFERENCE);
  });

  it("lets the operating-system reduced-motion preference take precedence", () => {
    expect(resolveEffectiveMotion("expressive", false)).toBe("expressive");
    expect(resolveEffectiveMotion("standard", false)).toBe("standard");
    expect(resolveEffectiveMotion("expressive", true)).toBe("none");
  });
});
