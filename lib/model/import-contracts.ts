import type { LibraryDocumentV2 } from "./library-document";
import type { SnapshotReference } from "./operation-contracts";
import type { IsoDateTime, Passthrough } from "./shared";

export const IMPORT_MODES = ["merge", "replace"] as const;
export type ImportMode = (typeof IMPORT_MODES)[number];

export const IMPORT_ENTITY_KINDS = [
  "game",
  "saved-view",
  "franchise",
  "document",
] as const;

export type ImportEntityKind = (typeof IMPORT_ENTITY_KINDS)[number];

export const IMPORT_CONFLICT_CODES = [
  "ambiguous-identity",
  "conflicting-external-identities",
  "custom-view-uses-system-id",
  "entity-kind-mismatch",
  "duplicate-incoming-id",
  "missing-default-view",
  "invalid-document",
] as const;

export type ImportConflictCode = (typeof IMPORT_CONFLICT_CODES)[number];

export const IMPORT_CONFLICT_RESOLUTIONS = [
  "use-incoming",
  "keep-existing",
  "import-as-new",
  "cancel-import",
] as const;

export type ImportConflictResolution =
  (typeof IMPORT_CONFLICT_RESOLUTIONS)[number];

export type ImportConflict = Passthrough<{
  id: string;
  entity: ImportEntityKind;
  code: ImportConflictCode;
  incomingId?: string;
  existingIds: string[];
  allowedResolutions: ImportConflictResolution[];
  resolution?: ImportConflictResolution;
}>;

export const GAME_IMPORT_IDENTITY_ORDER = [
  "id",
  "steamAppId",
  "igdbId",
  "normalizedNameWithoutExternalIds",
] as const;

export const VIEW_IMPORT_IDENTITY_ORDER = ["stable-system-id", "custom-id"] as const;
export const FRANCHISE_IMPORT_IDENTITY_ORDER = ["normalized-franchise-name"] as const;

export type ImportPlan = Passthrough<{
  id: string;
  mode: ImportMode;
  createdAt: IsoDateTime;
  sourceVersion: number | "bare-game-array";
  candidate: LibraryDocumentV2;
  conflicts: ImportConflict[];
  canApply: boolean;
  snapshotRequired: true;
  containsSensitiveValues: boolean;
}>;

export type BeforeImportSnapshotRequest = {
  importPlanId: string;
  mode: ImportMode;
  current: LibraryDocumentV2;
};

export type BeforeImportSnapshotHook = (
  request: BeforeImportSnapshotRequest,
) => Promise<SnapshotReference>;

export type ImportApplyResult = Passthrough<{
  importPlanId: string;
  appliedAt: IsoDateTime;
  snapshot: SnapshotReference;
  document: LibraryDocumentV2;
}>;

export const IMPORT_ATOMICITY_CONTRACT = {
  validateBeforeSnapshot: true,
  resolveConflictsBeforeSnapshot: true,
  snapshotBeforeWrite: true,
  singleDocumentWrite: true,
  partialApplyAllowed: false,
} as const;
