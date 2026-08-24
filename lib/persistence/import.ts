import { newGameId, normalizeGame, type GameRecord } from "../game-fields";
import type {
  BeforeImportSnapshotHook,
  ImportApplyResult,
  ImportConflict,
  ImportConflictResolution,
  ImportMode,
  ImportPlan,
} from "../model/import-contracts";
import type {
  LibraryCredentials,
  LibraryDocumentV2,
} from "../model/library-document";
import type { FranchisePresentation, LibraryGameRecordV2 } from "../model/shared";
import type { SavedView } from "../model/views";
import { isoDateTimeSchema } from "../model/value-schemas";
import { normalizeGamePositions } from "../priority";
import { buildLibraryDocument, canonicalDocumentForWrite, parseLibraryDocument } from "./migration";
import type { LibraryRepository } from "./repository";
import type { LibraryDocument, LibrarySettings } from "./schema";
import { newCustomSavedViewId, normalizeSavedViews } from "./views";

export type ImportResult = {
  document: LibraryDocument;
  added: number;
  updated: number;
  skipped: number;
};

export type PreparedImportPlan = ImportPlan & {
  sensitiveCredentials?: LibraryCredentials;
};
export type PlanLibraryImportOptions = {
  now?: string;
  resolutions?: Record<string, ImportConflictResolution>;
  acceptLegacySecrets?: { warningAcknowledgedAt: string };
};

function normalizedName(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase("de-DE");
}
export function normalizeFranchiseIdentity(name: string): string {
  return normalizedName(name);
}
function gameMatches(
  existing: readonly GameRecord[],
  incoming: GameRecord,
): GameRecord[] {
  const matches = new Map<string, GameRecord>();
  const add = (game: GameRecord | undefined) => {
    if (game) matches.set(game.id, game);
  };
  add(existing.find((game) => game.id === incoming.id));
  if (incoming.steamAppId !== null) {
    existing.filter((game) => game.steamAppId === incoming.steamAppId).forEach(add);
  }
  if (incoming.igdbId !== null) {
    existing.filter((game) => game.igdbId === incoming.igdbId).forEach(add);
  }
  if (incoming.steamAppId === null && incoming.igdbId === null) {
    existing
      .filter(
        (game) =>
          game.steamAppId === null &&
          game.igdbId === null &&
          normalizedName(game.name) === normalizedName(incoming.name),
      )
      .forEach(add);
  }
  return [...matches.values()];
}

function gameConflictCode(
  existing: readonly GameRecord[],
  incoming: GameRecord,
): ImportConflict["code"] {
  const identityMatches = [
    existing.filter((game) => game.id === incoming.id).map((game) => game.id),
    incoming.steamAppId === null
      ? []
      : existing.filter((game) => game.steamAppId === incoming.steamAppId).map((game) => game.id),
    incoming.igdbId === null
      ? []
      : existing.filter((game) => game.igdbId === incoming.igdbId).map((game) => game.id),
  ].filter((ids) => ids.length > 0);
  const uniqueTargets = new Set(identityMatches.flat());
  return identityMatches.length > 1 && uniqueTargets.size > 1
    ? "conflicting-external-identities"
    : "ambiguous-identity";
}

export function findExistingGame(
  existing: readonly GameRecord[],
  incoming: GameRecord,
): GameRecord | undefined {
  const matches = gameMatches(existing, incoming);
  return matches.length === 1 ? matches[0] : undefined;
}

function mirrorQueue(games: readonly GameRecord[]): GameRecord[] {
  return normalizeGamePositions(games).map((game) => ({
    ...game,
    priority: game.queuePosition,
  }));
}

export function mergeImportedGames(
  current: readonly GameRecord[],
  incoming: readonly GameRecord[],
): { games: GameRecord[]; added: number; updated: number } {
  let games = current.map((game) => ({ ...game }));
  let added = 0;
  let updated = 0;
  for (const next of incoming) {
    const match = findExistingGame(games, next);
    if (match) {
      games = games.map((game) =>
        game.id === match.id
          ? normalizeGame({ ...game, ...next, id: match.id })
          : game,
      );
      updated += 1;
    } else {
      games.push(normalizeGame(next));
      added += 1;
    }
  }
  return { games: mirrorQueue(games), added, updated };
}

function conflict(
  entity: ImportConflict["entity"],
  code: ImportConflict["code"],
  incomingId: string | undefined,
  existingIds: string[],
  options: PlanLibraryImportOptions,
): ImportConflict {
  const id = `${entity}:${incomingId ?? "document"}:${code}`;
  const allowedResolutions: ImportConflictResolution[] =
    code === "custom-view-uses-system-id"
      ? ["keep-existing", "import-as-new", "cancel-import"]
      : ["use-incoming", "keep-existing", "import-as-new", "cancel-import"];
  const requestedResolution = options.resolutions?.[id];
  const resolution = requestedResolution && allowedResolutions.includes(requestedResolution)
    ? requestedResolution
    : undefined;
  return {
    id,
    entity,
    code,
    incomingId,
    existingIds,
    allowedResolutions,
    ...(resolution ? { resolution } : {}),
  };
}

function rawViewConflicts(raw: unknown, options: PlanLibraryImportOptions): ImportConflict[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const views = (raw as { savedViews?: unknown }).savedViews;
  if (!Array.isArray(views)) return [];
  return views.flatMap((view) => {
    if (!view || typeof view !== "object") return [];
    const value = view as { id?: unknown; kind?: unknown };
    return value.kind === "custom" && typeof value.id === "string" && value.id.startsWith("system:")
      ? [conflict("saved-view", "custom-view-uses-system-id", value.id, [value.id], options)]
      : [];
  });
}

function prepareRawViewConflicts(
  raw: unknown,
  conflicts: readonly ImportConflict[],
): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const source = raw as Record<string, unknown>;
  if (!Array.isArray(source.savedViews)) return raw;
  const resolutions = new Map(
    conflicts.map((item) => [item.incomingId, item.resolution]),
  );
  const savedViews = source.savedViews.flatMap((view) => {
    if (!view || typeof view !== "object") return [view];
    const candidate = view as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id : undefined;
    if (candidate.kind !== "custom" || !id?.startsWith("system:")) return [view];
    return resolutions.get(id) === "import-as-new"
      ? [{ ...candidate, id: newCustomSavedViewId() }]
      : [];
  });
  return { ...source, savedViews };
}

function mergeGamesForPlan(
  current: readonly LibraryGameRecordV2[],
  incoming: readonly LibraryGameRecordV2[],
  options: PlanLibraryImportOptions,
  conflicts: ImportConflict[],
): LibraryGameRecordV2[] {
  let games = current.map((game) => ({ ...game }));
  for (const next of incoming) {
    const matches = gameMatches(games as GameRecord[], next as GameRecord);
    if (matches.length > 1) {
      const issue = conflict(
        "game",
        gameConflictCode(games as GameRecord[], next as GameRecord),
        next.id,
        matches.map((game) => game.id),
        options,
      );
      conflicts.push(issue);
      if (!issue.resolution || issue.resolution === "keep-existing" || issue.resolution === "cancel-import") continue;
      if (issue.resolution === "import-as-new") {
        games.push({ ...next, id: newGameId() });
        continue;
      }
    }
    const match = matches[0];
    if (match) {
      games = games.map((game) => game.id === match.id ? { ...game, ...next, id: match.id } : game);
    } else {
      games.push({ ...next });
    }
  }
  return normalizeGamePositions(games);
}

function mergeViews(current: readonly SavedView[], incoming: readonly SavedView[]): SavedView[] {
  const custom = new Map(
    current.filter((view) => view.kind === "custom").map((view) => [view.id, view]),
  );
  for (const view of incoming) {
    if (view.kind === "custom" && !view.id.startsWith("system:")) custom.set(view.id, view);
  }
  return [...current.filter((view) => view.kind === "system"), ...custom.values()];
}

function mergeFranchises(
  current: readonly FranchisePresentation[],
  incoming: readonly FranchisePresentation[],
): FranchisePresentation[] {
  const merged = new Map(current.map((item) => [normalizeFranchiseIdentity(item.franchise), item]));
  for (const item of incoming) merged.set(normalizeFranchiseIdentity(item.franchise), item);
  return [...merged.values()];
}

function mergeDocuments(
  current: LibraryDocumentV2,
  incoming: LibraryDocumentV2,
  mode: ImportMode,
  options: PlanLibraryImportOptions,
  conflicts: ImportConflict[],
): LibraryDocumentV2 {
  if (mode === "replace") return canonicalDocumentForWrite(incoming);
  const views = normalizeSavedViews(
    mergeViews(current.savedViews, incoming.savedViews),
    incoming.defaultView,
  );
  return canonicalDocumentForWrite({
    ...current,
    ...incoming,
    games: mergeGamesForPlan(current.games, incoming.games, options, conflicts),
    ...views,
    franchises: mergeFranchises(current.franchises, incoming.franchises),
  });
}

function planId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function planLibraryImport(
  raw: unknown,
  current: LibraryDocumentV2,
  mode: ImportMode,
  options: PlanLibraryImportOptions = {},
): PreparedImportPlan {
  const conflicts = rawViewConflicts(raw, options);
  const parsed = parseLibraryDocument(
    prepareRawViewConflicts(raw, conflicts),
    { now: options.now },
  );
  const candidate = mergeDocuments(current, parsed.document, mode, options, conflicts);
  const unresolved = conflicts.some((item) => !item.resolution || item.resolution === "cancel-import");
  let sensitiveCredentials = parsed.sensitive?.credentials;
  if (parsed.legacyCredentials && options.acceptLegacySecrets) {
    isoDateTimeSchema.parse(options.acceptLegacySecrets.warningAcknowledgedAt);
    sensitiveCredentials = parsed.legacyCredentials;
  }
  return {
    id: planId(),
    mode,
    createdAt: options.now ?? new Date().toISOString(),
    sourceVersion: parsed.sourceVersion,
    candidate,
    conflicts,
    canApply: !unresolved,
    snapshotRequired: true,
    containsSensitiveValues: sensitiveCredentials !== undefined,
    ...(sensitiveCredentials ? { sensitiveCredentials } : {}),
  };
}

export async function applyLibraryImport(
  plan: PreparedImportPlan,
  repository: LibraryRepository,
  beforeImportSnapshot: BeforeImportSnapshotHook,
  now = new Date().toISOString(),
): Promise<ImportApplyResult> {
  if (!plan.canApply || plan.conflicts.some((item) => !item.resolution || item.resolution === "cancel-import")) {
    throw new Error("Import plan has unresolved conflicts");
  }
  const candidate = canonicalDocumentForWrite(plan.candidate);
  const current = repository.load() ?? repository.empty();
  const snapshot = await beforeImportSnapshot({
    importPlanId: plan.id,
    mode: plan.mode,
    current,
  });
  const document = repository.writeAtomic({
    document: candidate,
    ...(plan.sensitiveCredentials ? { credentials: plan.sensitiveCredentials } : {}),
  });
  return { importPlanId: plan.id, appliedAt: now, snapshot, document };
}

export function importLibraryPayload(
  raw: unknown,
  currentGames: readonly GameRecord[],
  currentSettings: LibrarySettings,
): ImportResult {
  const { document, skipped } = parseLibraryDocument(raw);
  const merged = mergeImportedGames(currentGames, document.games);
  const settings: LibrarySettings = {
    sortBy: document.settings.sortBy || currentSettings.sortBy,
    sortDir: document.settings.sortDir || currentSettings.sortDir,
    steamId: document.settings.steamId || currentSettings.steamId,
    steamApiKey: currentSettings.steamApiKey,
    igdbClientId: document.settings.igdbClientId || currentSettings.igdbClientId,
    igdbClientSecret: currentSettings.igdbClientSecret,
  };
  return {
    document: buildLibraryDocument(merged.games, settings, document.exportedAt, document),
    added: merged.added,
    updated: merged.updated,
    skipped,
  };
}
