import { createQueuedJob, type RuntimeJob } from "@/lib/jobs";

export type MetadataRefreshTarget = {
  gameId: string;
  externalId: number;
};

export function createMetadataRefreshJobs(
  source: "steam" | "igdb",
  targets: readonly MetadataRefreshTarget[],
  createId: () => string = () =>
    globalThis.crypto?.randomUUID?.() ?? `metadata-job-${Date.now()}`,
): RuntimeJob[] {
  const createdAt = new Date().toISOString();
  return targets.map((target) =>
    createQueuedJob({
      id: createId(),
      kind: `metadata.${source}`,
      createdAt,
      payload: {
        gameId: target.gameId,
        [source === "steam" ? "steamAppId" : "igdbId"]: target.externalId,
      },
      progress: {
        processed: 0,
        remaining: 1,
        failed: 0,
        total: 1,
        message: `${source === "steam" ? "Steam" : "IGDB"}-Metadaten warten auf die App.`,
      },
    }),
  );
}
