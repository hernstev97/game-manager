import { describe, expect, it } from "vitest";
import { inspectRateLimitResponse } from "./headers";
import { batchIgdbQueries } from "./igdb-batching";
import {
  IGDB_RATE_LIMIT_POLICY,
  createSteamRateLimitPolicy,
} from "./policies";
import { parseRetryAfter } from "./retry-after";

describe("official service policies", () => {
  it("uses IGDB's published request and open-request limits", () => {
    expect(IGDB_RATE_LIMIT_POLICY).toMatchObject({
      maxConcurrency: 8,
      minIntervalMs: 250,
      batch: { maxQueries: 10 },
    });
  });

  it("keeps Steam's conservative local defaults configurable", () => {
    expect(createSteamRateLimitPolicy({ maxConcurrency: 1, minIntervalMs: 2_500 })).toMatchObject({
      service: "steam",
      maxConcurrency: 1,
      minIntervalMs: 2_500,
      headerDriven: true,
    });
  });
});

describe("rate-limit response handling", () => {
  const now = Date.parse("2026-08-22T10:00:00.000Z");

  it("reads Twitch token-bucket headers and its reset time on 429", () => {
    const observation = inspectRateLimitResponse(
      "twitch",
      429,
      {
        "Ratelimit-Limit": "800",
        "Ratelimit-Remaining": "0",
        "Ratelimit-Reset": String((now + 15_000) / 1_000),
      },
      now,
    );
    expect(observation).toEqual({
      limited: true,
      limit: 800,
      remaining: 0,
      retryAt: "2026-08-22T10:00:15.000Z",
      retryAfterSeconds: 15,
    });
  });

  it("parses Retry-After in seconds and HTTP-date form", () => {
    expect(parseRetryAfter("12", now)).toBe(12_000);
    expect(parseRetryAfter("Sat, 22 Aug 2026 10:00:09 GMT", now)).toBe(9_000);
    expect(parseRetryAfter("invalid", now)).toBeUndefined();
  });

  it("lets Retry-After drive Steam 429 handling without a made-up provider limit", () => {
    expect(
      inspectRateLimitResponse("steam", 429, { "retry-after": "3" }, now),
    ).toMatchObject({
      limited: true,
      retryAfterSeconds: 3,
      retryAt: "2026-08-22T10:00:03.000Z",
    });
  });
});

describe("IGDB batching", () => {
  it("builds valid multi-query batches of at most ten requests", () => {
    const batches = batchIgdbQueries(
      Array.from({ length: 11 }, (_, index) => ({
        endpoint: "games",
        name: `Game ${index}`,
        body: `fields name; where id = ${index + 1};`,
      })),
    );

    expect(batches.map((batch) => batch.queries.length)).toEqual([10, 1]);
    expect(batches[0].endpoint).toBe("/multiquery");
    expect(batches[0].body).toContain('query games "Game 0"');
  });
});
