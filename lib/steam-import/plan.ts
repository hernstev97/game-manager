import type { ImportConflict } from "@/lib/model";
import { createSteamImportGame, updateSteamImportGame } from "./candidate";
import {
  cloneSteamImportValue,
  fallbackSteamImportId,
  resolvedSteamConflict,
  steamImportTimestamp,
  unresolvedSteamConflict,
  type ResolvedSteamTarget,
} from "./internal";
import { prepareSteamImportJobs } from "./jobs";
import { createSteamReviewHandoff } from "./review";
import type {
  PrepareSteamImportPlanInput,
  SteamImportOperation,
  SteamImportPlan,
} from "./types";

/**
 * Builds a complete, snapshot-required candidate but never writes it. Name and
 * cover proposals stay exclusively in the explicit metadata-review handoff.
 */
export function prepareSteamImportPlan(
  input: PrepareSteamImportPlanInput,
): SteamImportPlan {
  const createdAt = steamImportTimestamp(input.now);
  const createId = input.createId ?? fallbackSteamImportId;
  const planId = createId("plan");
  const selected = new Set(input.selectedAppIds);
  const existingById = new Map(
    input.current.games.map((game) => [game.id, game]),
  );
  const sourceById = new Map(
    input.comparison.items.map((item) => [item.source.steamAppId, item]),
  );
  const conflicts: ImportConflict[] = [];
  const targets: ResolvedSteamTarget[] = [];
  const claimedTargets = new Map<string, number>();

  for (const appId of selected) {
    const item = sourceById.get(appId);
    if (!item) {
      conflicts.push({
        id: `steam:${appId}:missing-source`,
        entity: "game",
        code: "invalid-document",
        incomingId: String(appId),
        existingIds: [],
        allowedResolutions: ["cancel-import"],
      });
      continue;
    }
    let resolution = input.resolutions?.[String(appId)];
    if (
      (item.category === "safely-recognized" ||
        item.category === "already-current") &&
      item.matchedGameId
    ) {
      resolution = { kind: "existing", gameId: item.matchedGameId };
    } else if (item.category === "new") {
      resolution = { kind: "new" };
    }

    if (!resolution) {
      conflicts.push(unresolvedSteamConflict(item, item.candidateGameIds));
      continue;
    }
    const resolvedIssue = resolvedSteamConflict(
      unresolvedSteamConflict(item, item.candidateGameIds),
      resolution,
    );
    if (resolution.kind === "existing") {
      const existing = existingById.get(resolution.gameId);
      if (!existing || !item.candidateGameIds.includes(resolution.gameId)) {
        conflicts.push(
          unresolvedSteamConflict(item, item.candidateGameIds, "invalid-target"),
        );
        continue;
      }
      if (
        existing.steamAppId !== null &&
        existing.steamAppId !== item.source.steamAppId
      ) {
        conflicts.push(
          unresolvedSteamConflict(item, [existing.id], "external-id-conflict"),
        );
        continue;
      }
      const duplicateSteamId = input.current.games.some(
        (game) =>
          game.id !== existing.id &&
          game.steamAppId === item.source.steamAppId,
      );
      if (duplicateSteamId) {
        conflicts.push(
          unresolvedSteamConflict(item, item.candidateGameIds, "duplicate-steam-id"),
        );
        continue;
      }
      const claimedBy = claimedTargets.get(existing.id);
      if (claimedBy !== undefined && claimedBy !== appId) {
        conflicts.push(
          unresolvedSteamConflict(item, [existing.id], "target-already-claimed"),
        );
        continue;
      }
      claimedTargets.set(existing.id, appId);
      targets.push({ item, gameId: existing.id, existing });
      if (item.category === "possible-match" || item.category === "conflict") {
        conflicts.push(resolvedIssue);
      }
      continue;
    }

    const duplicateSteamId = input.current.games.some(
      (game) => game.steamAppId === item.source.steamAppId,
    );
    if (duplicateSteamId) {
      conflicts.push(
        unresolvedSteamConflict(item, item.candidateGameIds, "duplicate-steam-id"),
      );
      continue;
    }
    const gameId = createId("game");
    if (
      existingById.has(gameId) ||
      targets.some((target) => target.gameId === gameId)
    ) {
      conflicts.push({
        id: `steam:${appId}:duplicate-game-id`,
        entity: "game",
        code: "duplicate-incoming-id",
        incomingId: gameId,
        existingIds: existingById.has(gameId) ? [gameId] : [],
        allowedResolutions: ["cancel-import"],
      });
      continue;
    }
    targets.push({ item, gameId });
    if (item.category === "possible-match" || item.category === "conflict") {
      conflicts.push(resolvedIssue);
    }
  }

  const operations: SteamImportOperation[] = [];
  const candidateGames = input.current.games.map(cloneSteamImportValue);
  for (const target of targets) {
    if (!target.existing) {
      const after = createSteamImportGame(
        target.item.source,
        target.gameId,
        createdAt,
      );
      candidateGames.push(after);
      operations.push({
        kind: "add",
        steamAppId: target.item.source.steamAppId,
        targetGameId: target.gameId,
        after: cloneSteamImportValue(after),
      });
      continue;
    }
    const after = updateSteamImportGame(
      target.item.source,
      target.existing,
      createdAt,
    );
    if (!after) continue;
    const index = candidateGames.findIndex((game) => game.id === target.gameId);
    candidateGames[index] = after;
    operations.push({
      kind: "update",
      steamAppId: target.item.source.steamAppId,
      targetGameId: target.gameId,
      before: cloneSteamImportValue(target.existing),
      after: cloneSteamImportValue(after),
    });
  }

  const jobSelection = {
    details: input.jobs?.details ?? false,
    covers: input.jobs?.covers ?? false,
  };
  const jobs = prepareSteamImportJobs(
    planId,
    targets,
    jobSelection,
    createdAt,
    createId,
  );
  const reviewHandoff = createSteamReviewHandoff(
    planId,
    targets,
    jobSelection.covers,
    createdAt,
  );
  return {
    id: planId,
    mode: "merge",
    createdAt,
    sourceVersion: "bare-game-array",
    candidate: {
      ...cloneSteamImportValue(input.current),
      games: candidateGames,
    },
    conflicts,
    canApply: conflicts.every((conflict) => conflict.resolution !== undefined),
    snapshotRequired: true,
    containsSensitiveValues: false,
    source: "steam-library",
    selectedAppIds: [...selected],
    operations,
    jobs,
    reviewHandoff,
  };
}
