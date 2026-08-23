import { describe, expect, it } from "vitest";
import {
  ONBOARDING_PROGRESS_STORAGE_KEY,
  createOnboardingProgress,
  finishOnboarding,
  normalizeOnboardingProgress,
  readOnboardingProgress,
  shouldOfferOnboarding,
  writeOnboardingProgress,
} from "./progress";
import { detectInstallPlatform, getPwaInstallCopy } from "./platform";

describe("onboarding progress", () => {
  it("offers only a pending first run", () => {
    expect(shouldOfferOnboarding(createOnboardingProgress())).toBe(true);
    expect(shouldOfferOnboarding(finishOnboarding("add-game", "2026-08-22T10:00:00.000Z"))).toBe(false);
    expect(finishOnboarding("later", "2026-08-22T10:00:00.000Z").status).toBe("dismissed");
  });

  it("normalizes unknown and duplicated progress values", () => {
    expect(
      normalizeOnboardingProgress({
        version: 1,
        status: "completed",
        completedSteps: ["pwa", "pwa", "unknown", "welcome"],
        selectedAction: "import",
        updatedAt: "not-a-date",
      }),
    ).toEqual({
      version: 1,
      status: "completed",
      completedSteps: ["welcome", "pwa"],
      selectedAction: "import",
      updatedAt: null,
    });
  });

  it("round-trips storage and fails closed when storage is unavailable", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    const progress = finishOnboarding("connect-steam", "2026-08-22T10:00:00.000Z");
    expect(writeOnboardingProgress(progress, storage)).toBe(true);
    expect(values.has(ONBOARDING_PROGRESS_STORAGE_KEY)).toBe(true);
    expect(readOnboardingProgress(storage)).toEqual(progress);
    expect(
      readOnboardingProgress({
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => undefined,
      }),
    ).toEqual(createOnboardingProgress());
  });
});

describe("PWA platform copy", () => {
  it("recognizes iPadOS and Android", () => {
    expect(detectInstallPlatform({ platform: "MacIntel", maxTouchPoints: 5 })).toBe("ios");
    expect(detectInstallPlatform({ userAgent: "Mozilla/5.0 Android 15" })).toBe("android");
  });

  it("provides platform-specific, short installation instructions", () => {
    expect(getPwaInstallCopy("ios").instruction).toContain("Safari");
    expect(getPwaInstallCopy("android").instruction).toContain("Startbildschirm");
  });
});
