import { describe, expect, it } from "vitest";
import { createMetadataRefreshJobs } from "./library-job-factories";

describe("createMetadataRefreshJobs", () => {
  it("creates credential-free queued Steam work", () => {
    const jobs = createMetadataRefreshJobs(
      "steam",
      [{ gameId: "game-1", externalId: 42 }],
      () => "job-1",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: "job-1",
      kind: "metadata.steam",
      state: "queued",
      payload: { gameId: "game-1", steamAppId: 42 },
      progress: { processed: 0, remaining: 1, failed: 0, total: 1 },
      errors: [],
    });
    expect(JSON.stringify(jobs[0])).not.toMatch(/key|secret|token/i);
  });

  it("creates one independent IGDB job per target", () => {
    let id = 0;
    const jobs = createMetadataRefreshJobs(
      "igdb",
      [
        { gameId: "a", externalId: 11 },
        { gameId: "b", externalId: 12 },
      ],
      () => `job-${++id}`,
    );

    expect(jobs.map((job) => job.id)).toEqual(["job-1", "job-2"]);
    expect(jobs.map((job) => job.payload)).toEqual([
      { gameId: "a", igdbId: 11 },
      { gameId: "b", igdbId: 12 },
    ]);
  });
});
