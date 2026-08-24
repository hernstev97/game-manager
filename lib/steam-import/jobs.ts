import type { PersistedJob } from "@/lib/model";
import type { ResolvedSteamTarget } from "./internal";

export function prepareSteamImportJobs(
  planId: string,
  targets: readonly ResolvedSteamTarget[],
  selections: { details: boolean; covers: boolean },
  createdAt: string,
  createId: (kind: "plan" | "game" | "job") => string,
): PersistedJob[] {
  const jobs: PersistedJob[] = [];
  const jobIds = new Set<string>();
  for (const target of targets) {
    for (const kind of ["details", "covers"] as const) {
      if (!selections[kind]) continue;
      const id = createId("job");
      if (jobIds.has(id)) {
        throw new Error("Steam import job IDs must be unique");
      }
      jobIds.add(id);
      jobs.push({
        id,
        kind: `steam-import.${kind}`,
        state: "queued",
        createdAt,
        updatedAt: createdAt,
        payload: {
          importPlanId: planId,
          gameId: target.gameId,
          steamAppId: target.item.source.steamAppId,
        },
        progress: {
          processed: 0,
          remaining: 1,
          failed: 0,
          total: 1,
          message:
            kind === "details"
              ? "Steam-Details warten auf die App."
              : "Steam-Cover warten auf die App.",
        },
        errors: [],
      });
    }
  }
  return jobs;
}
