import { describe, expect, it } from "vitest";
import { sanitizeDiagnosticText, sanitizeJobFailure } from "./errors";
import { transitionJobFailure } from "./failure";
import { calculateBackoffDelay } from "./retry";
import { createQueuedJob, type RuntimeJob } from "./state";

const policy = {
  maxAttempts: 4,
  baseDelayMs: 1_000,
  maxDelayMs: 10_000,
  jitterRatio: 0.2,
};

function running(): RuntimeJob {
  return { ...createQueuedJob({ id: "one", kind: "sync", payload: {} }), state: "running" };
}

describe("job retries", () => {
  it("calculates deterministic exponential backoff with bounded jitter", () => {
    expect(calculateBackoffDelay(1, policy, () => 0.5)).toBe(1_000);
    expect(calculateBackoffDelay(3, policy, () => 0.5)).toBe(4_000);
    expect(calculateBackoffDelay(2, policy, () => 0)).toBe(1_600);
    expect(calculateBackoffDelay(10, policy, () => 1)).toBe(10_000);
  });

  it("honors Retry-After and aggregates repeated sanitized failures", () => {
    const failure = {
      code: "rate-limited",
      message: "API busy",
      retryable: true,
      status: 429,
      headers: { "Retry-After": "7" },
    };
    const first = transitionJobFailure(running(), failure, {
      policy,
      service: "steam",
      nowMs: Date.parse("2026-08-22T10:00:00.000Z"),
      occurredAt: "2026-08-22T10:00:00.000Z",
      random: () => 0.5,
    });
    const second = transitionJobFailure(
      { ...first, state: "running" },
      failure,
      {
        policy,
        service: "steam",
        nowMs: Date.parse("2026-08-22T10:00:07.000Z"),
        occurredAt: "2026-08-22T10:00:07.000Z",
        random: () => 0.5,
      },
    );

    expect(first).toMatchObject({
      state: "paused",
      pauseReason: "rate-limit",
      retryAfterSeconds: 7,
      nextAttemptAt: "2026-08-22T10:00:07.000Z",
    });
    expect(second.errors).toMatchObject([
      { code: "rate-limited", count: 2, lastOccurredAt: "2026-08-22T10:00:07.000Z" },
    ]);
  });
});

describe("safe job diagnostics", () => {
  it("removes bearer tokens, secrets, and complete request URLs", () => {
    const source =
      "GET https://api.example.test/games?key=supersecret Authorization=BearerSecret Bearer abc.def";
    const sanitized = sanitizeDiagnosticText(source);

    expect(sanitized).not.toContain("supersecret");
    expect(sanitized).not.toContain("BearerSecret");
    expect(sanitized).not.toContain("abc.def");
    expect(sanitized).not.toContain("/games");
    expect(sanitized).toContain("[redacted-url:api.example.test]");
  });

  it("sanitizes unexpected errors before aggregation", () => {
    expect(
      sanitizeJobFailure(new Error("token=hunter2 at https://private.test/a/b")),
    ).toMatchObject({
      code: "unexpected-error",
      retryable: false,
    });
    expect(
      sanitizeJobFailure(new Error("token=hunter2 at https://private.test/a/b")).message,
    ).not.toContain("hunter2");
  });
});
