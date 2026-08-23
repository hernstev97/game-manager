import { beforeEach, describe, expect, it, vi } from "vitest";
import { librarySaveStatus } from "./save-status";

describe("librarySaveStatus", () => {
  beforeEach(() => vi.useFakeTimers());

  it("keeps the saving state briefly before reporting a local success", () => {
    const attempt = librarySaveStatus.begin();
    expect(librarySaveStatus.getSnapshot().kind).toBe("saving");
    librarySaveStatus.succeed(attempt, "2026-08-22T10:00:00.000Z");
    expect(librarySaveStatus.getSnapshot().kind).toBe("saving");
    vi.advanceTimersByTime(220);
    expect(librarySaveStatus.getSnapshot()).toMatchObject({
      kind: "saved",
      lastSavedAt: "2026-08-22T10:00:00.000Z",
    });
  });

  it("keeps errors visible and classifies quota failures", () => {
    const attempt = librarySaveStatus.begin();
    librarySaveStatus.fail(attempt, { name: "QuotaExceededError" });
    expect(librarySaveStatus.getSnapshot()).toMatchObject({
      kind: "quota",
      message: "Lokaler Speicherplatz reicht nicht aus.",
    });
  });
});
