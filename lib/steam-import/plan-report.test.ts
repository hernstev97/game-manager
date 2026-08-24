import { describe, expect, it } from "vitest";
import { normalizeGame } from "@/lib/game-fields";
import type {
  ImportApplyResult,
  LibraryDocumentV2,
  LibraryGameRecordV2,
} from "@/lib/model";
import { emptyLibraryDocument } from "@/lib/persistence/repository";
import {
  compareSteamLibrary,
  createSteamImportReport,
  prepareSteamImportPlan,
} from "./index";

function game(
  id: string,
  overrides: Record<string, unknown> = {},
): LibraryGameRecordV2 {
  const canonical = {
    ...normalizeGame({ id, name: id, ...overrides }),
  } as Record<string, unknown>;
  delete canonical.priority;
  return canonical as LibraryGameRecordV2;
}

function document(games: LibraryGameRecordV2[]): LibraryDocumentV2 {
  return { ...emptyLibraryDocument(), games };
}

function ids() {
  let sequence = 0;
  return (kind: "plan" | "game" | "job") => `${kind}-${++sequence}`;
}

const NOW = "2026-08-22T10:00:00.000Z";

describe("Steam atomic import planning", () => {
  it("keeps name metadata out of a safe automatic update and adds new games", () => {
    const existing = game("known", {
      name: "Local title",
      steamAppId: 10,
      owned: false,
      playtimeMinutes: 4,
      provenance: {
        name: { source: "manual", updatedAt: "2026-01-01T00:00:00.000Z" },
      },
    });
    const current = document([existing]);
    const comparison = compareSteamLibrary(
      [
        { steamAppId: 10, name: "Steam title", playtimeMinutes: 8, igdbId: null },
        { steamAppId: 20, name: "New game", playtimeMinutes: 2, igdbId: null },
      ],
      current.games,
    );
    const plan = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [10, 20],
      jobs: { details: true, covers: true },
      now: NOW,
      createId: ids(),
    });

    expect(plan).toMatchObject({
      mode: "merge",
      sourceVersion: "bare-game-array",
      snapshotRequired: true,
      containsSensitiveValues: false,
      canApply: true,
      source: "steam-library",
    });
    expect(plan.operations.map((operation) => operation.kind)).toEqual([
      "update",
      "add",
    ]);
    expect(plan.candidate.games.find((item) => item.id === "known")).toMatchObject({
      id: "known",
      name: "Local title",
      steamAppId: 10,
      owned: true,
      playtimeMinutes: 8,
    });
    const added = plan.operations.find((operation) => operation.kind === "add");
    expect(added?.after).toMatchObject({
      name: "New game",
      steamAppId: 20,
      owned: true,
      playtimeMinutes: 2,
      dateAdded: NOW,
    });
    expect(added?.after).not.toHaveProperty("priority");
    expect(plan.jobs).toHaveLength(4);
    expect(JSON.stringify(plan.jobs)).not.toMatch(/api.?key|secret|token/i);
  });

  it("blocks a selected name match until the user explicitly resolves it", () => {
    const current = document([
      game("local", { name: "Same Name", steamAppId: null, owned: false }),
    ]);
    const comparison = compareSteamLibrary(
      [{ steamAppId: 30, name: "same   name", playtimeMinutes: 3, igdbId: null }],
      current.games,
    );
    const unresolved = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [30],
      now: NOW,
      createId: ids(),
    });
    expect(unresolved.canApply).toBe(false);
    expect(unresolved.operations).toEqual([]);
    expect(unresolved.conflicts[0]).toMatchObject({
      code: "ambiguous-identity",
    });
    expect(unresolved.conflicts[0]).not.toHaveProperty("resolution");

    const resolved = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [30],
      resolutions: { "30": { kind: "existing", gameId: "local" } },
      now: NOW,
      createId: ids(),
    });
    expect(resolved.canApply).toBe(true);
    expect(resolved.conflicts[0].resolution).toBe("use-incoming");
    expect(resolved.candidate.games[0]).toMatchObject({
      id: "local",
      name: "Same Name",
      steamAppId: 30,
    });
  });

  it("does not allow an explicit mapping to create a duplicate Steam App-ID", () => {
    const current = document([
      game("duplicate-a", { steamAppId: 10 }),
      game("duplicate-b", { steamAppId: 10 }),
    ]);
    const comparison = compareSteamLibrary(
      [{ steamAppId: 10, name: "Duplicate", playtimeMinutes: 0, igdbId: null }],
      current.games,
    );
    const plan = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [10],
      resolutions: { "10": { kind: "existing", gameId: "duplicate-a" } },
      now: NOW,
      createId: ids(),
    });

    expect(plan.canApply).toBe(false);
    expect(plan.operations).toEqual([]);
  });

  it("rejects tampered selections and generated internal-ID collisions", () => {
    const current = document([game("game-collision")]);
    const comparison = compareSteamLibrary(
      [{ steamAppId: 20, name: "New", playtimeMinutes: 0, igdbId: null }],
      current.games,
    );
    const missing = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [999],
      now: NOW,
      createId: ids(),
    });
    expect(missing.canApply).toBe(false);
    expect(missing.conflicts[0].code).toBe("invalid-document");

    const collision = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [20],
      now: NOW,
      createId: (kind) =>
        kind === "plan" ? "plan-collision" : "game-collision",
    });
    expect(collision.canApply).toBe(false);
    expect(collision.conflicts[0].code).toBe("duplicate-incoming-id");
    expect(collision.operations).toEqual([]);
  });

  it("prepares cover and manual-name changes only for explicit review", () => {
    const current = document([
      game("known", {
        name: "Manual Name",
        steamAppId: 10,
        owned: false,
        provenance: {
          name: { source: "manual", updatedAt: "2026-01-01T00:00:00.000Z" },
        },
      }),
    ]);
    const comparison = compareSteamLibrary(
      [{ steamAppId: 10, name: "Steam Name", playtimeMinutes: 0, igdbId: null }],
      current.games,
    );
    const plan = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [10],
      jobs: { covers: true },
      now: NOW,
      createId: ids(),
    });
    const changes = plan.reviewHandoff.preview.metadata;
    const name = changes.find((change) => change.fieldId === "name");
    const covers = changes.filter((change) => change.category === "cover");

    expect(plan.reviewHandoff.requiresExplicitConfirmation).toBe(true);
    expect(name?.defaultSelection).toEqual({
      selected: false,
      reason: "manual-value-protected",
    });
    expect(covers.map((change) => change.fieldId)).toEqual([
      "coverUrl",
      "landscapeArtwork",
    ]);
    expect(covers.every((change) => !change.defaultSelection.selected)).toBe(true);
    expect(plan.candidate.games[0]).toMatchObject({
      name: "Manual Name",
      coverUrl: "",
      landscapeArtwork: null,
      caseArtwork: null,
    });
  });
});

describe("Steam import report", () => {
  it("reports the prepared atomic operations and handoffs", () => {
    const current = document([]);
    const comparison = compareSteamLibrary(
      [{ steamAppId: 20, name: "New", playtimeMinutes: 2, igdbId: null }],
      current.games,
    );
    const plan = prepareSteamImportPlan({
      current,
      comparison,
      selectedAppIds: [20],
      jobs: { details: true, covers: true },
      now: NOW,
      createId: ids(),
    });
    const result: ImportApplyResult = {
      importPlanId: plan.id,
      appliedAt: NOW,
      snapshot: {
        id: "snapshot-1",
        createdAt: NOW,
        reason: "before-import",
        documentVersion: 2,
      },
      document: plan.candidate,
    };
    const report = createSteamImportReport(plan, result, {
      jobs: "prepared",
      review: "prepared",
    });

    expect(report).toMatchObject({
      importPlanId: plan.id,
      added: 1,
      updated: 0,
      skipped: 0,
      jobsPrepared: 2,
      reviewChangesPrepared: 2,
      jobsHandoff: "prepared",
      reviewHandoff: "prepared",
    });
    expect(report.items).toEqual([
      {
        steamAppId: 20,
        gameId: plan.operations[0].targetGameId,
        status: "added",
      },
    ]);
  });
});
