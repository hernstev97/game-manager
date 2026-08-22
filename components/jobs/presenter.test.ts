import { describe, expect, it } from "vitest";
import { createQueuedJob, type RuntimeJob } from "@/lib/jobs/state";
import {
  aggregateJobErrors,
  deriveJobStatus,
  formatNextAttempt,
  getNextAttemptAt,
  presentJobProgress,
  sortJobsForDisplay,
  summarizeJobs,
} from "./presenter";

function job(
  id: string,
  state: RuntimeJob["state"],
  additions: Partial<RuntimeJob> = {},
): RuntimeJob {
  return {
    ...createQueuedJob({
      id,
      kind: "metadata-refresh",
      payload: {},
      createdAt: "2026-08-22T09:00:00.000Z",
    }),
    state,
    ...additions,
  };
}

describe("job status presentation", () => {
  it("never presents session work as running while the app is offline", () => {
    expect(deriveJobStatus(job("running", "running"), false)).toBe("offline");
    expect(deriveJobStatus(job("queued", "queued"), false)).toBe("offline");
    expect(deriveJobStatus(job("done", "succeeded"), false)).toBe("succeeded");
  });

  it("distinguishes offline, rate-limit, and app-closed waits", () => {
    expect(deriveJobStatus(job("offline", "paused", { pauseReason: "offline" }), true)).toBe("offline");
    expect(deriveJobStatus(job("limited", "paused", { pauseReason: "rate-limit" }), true)).toBe("rate-limit");
    expect(deriveJobStatus(job("closed", "interrupted", { pauseReason: "app-closed" }), true)).toBe("interrupted");
  });

  it("orders actionable states before history and failures before successes", () => {
    const sorted = sortJobsForDisplay([
      job("done", "succeeded"),
      job("failed", "failed"),
      job("queued", "queued"),
      job("running", "running"),
    ], true);
    expect(sorted.map((item) => item.id)).toEqual(["running", "queued", "failed", "done"]);
  });
});

describe("job progress presentation", () => {
  it("derives a bounded percentage from processed, failed, and remaining work", () => {
    expect(presentJobProgress(job("one", "running", {
      progress: { processed: 4, failed: 1, remaining: 5, total: 10 },
    }))).toEqual({
      processed: 4,
      failed: 1,
      remaining: 5,
      completed: 5,
      total: 10,
      percent: 50,
    });
  });

  it("normalizes invalid counts and does not invent a percentage without a total", () => {
    expect(presentJobProgress(job("one", "running", {
      progress: { processed: 2.8, failed: -2, remaining: 4.9, total: null },
    }))).toEqual({
      processed: 2,
      failed: 0,
      remaining: 4,
      completed: 2,
      total: null,
      percent: null,
    });
  });

  it("aggregates overall progress without claiming precision if one total is unknown", () => {
    const summary = summarizeJobs([
      job("known", "running", {
        progress: { processed: 3, failed: 1, remaining: 6, total: 10 },
      }),
      job("unknown", "queued", {
        progress: { processed: 2, failed: 0, remaining: 3, total: null },
      }),
    ], true);
    expect(summary.progress).toMatchObject({
      processed: 5,
      failed: 1,
      remaining: 9,
      total: null,
      percent: null,
    });
  });
});

describe("retry time presentation", () => {
  it("uses the persisted next-attempt timestamp ahead of Retry-After", () => {
    const limited = job("limited", "paused", {
      pauseReason: "rate-limit",
      updatedAt: "2026-08-22T10:00:00.000Z",
      nextAttemptAt: "2026-08-22T10:00:12.000Z",
      retryAfterSeconds: 99,
    });
    expect(getNextAttemptAt(limited)).toBe("2026-08-22T10:00:12.000Z");
    expect(formatNextAttempt(
      limited,
      Date.parse("2026-08-22T10:00:02.000Z"),
      "de-DE",
    )?.label).toContain("in 10 s");
  });

  it("falls back to Retry-After relative to the last update", () => {
    expect(getNextAttemptAt(job("limited", "paused", {
      updatedAt: "2026-08-22T10:00:00.000Z",
      retryAfterSeconds: 7,
    }))).toBe("2026-08-22T10:00:07.000Z");
  });
});

describe("safe error aggregation", () => {
  it("groups duplicate error codes, keeps the newest message, and removes secrets and URLs", () => {
    const errors = aggregateJobErrors([
      {
        code: "provider-error",
        message: "token=hunter2 GET https://private.test/path?q=secret",
        count: 2,
        lastOccurredAt: "2026-08-22T10:00:00.000Z",
        retryable: true,
      },
      {
        code: "provider-error",
        message: "Authorization=BearerSecret Bearer abc.def at https://private.test/new",
        count: 3,
        lastOccurredAt: "2026-08-22T10:00:05.000Z",
        retryable: false,
      },
    ]);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "provider-error", count: 5, retryable: false });
    expect(errors[0].message).not.toContain("hunter2");
    expect(errors[0].message).not.toContain("BearerSecret");
    expect(errors[0].message).not.toContain("abc.def");
    expect(errors[0].message).not.toContain("https://");
    expect(errors[0].message).not.toContain("/new");
  });
});
