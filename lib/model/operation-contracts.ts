import type { LibraryDocumentV2 } from "./library-document";
import type { IsoDateTime, JsonObject, JsonValue, Passthrough } from "./shared";

export const UNDO_ENTITY_KINDS = [
  "game",
  "saved-view",
  "franchise",
  "preferences",
] as const;

export type UndoEntityKind = (typeof UNDO_ENTITY_KINDS)[number];

export type UndoChange = Passthrough<{
  entity: UndoEntityKind;
  entityId: string;
  before: JsonValue;
  after: JsonValue;
}>;

export type UndoTransaction = Passthrough<{
  id: string;
  label: string;
  createdAt: IsoDateTime;
  changes: UndoChange[];
}>;

export const SNAPSHOT_REASONS = [
  "before-import",
  "before-clear",
  "before-bulk-delete",
  "before-large-metadata-apply",
  "before-restore",
  "daily",
  "manual",
] as const;

export type SnapshotReason = (typeof SNAPSHOT_REASONS)[number];

export type SnapshotReference = Passthrough<{
  id: string;
  createdAt: IsoDateTime;
  reason: SnapshotReason;
  documentVersion: number;
  checksum?: string;
}>;

/** Full snapshot payload intended for IndexedDB side persistence. */
export type LibrarySnapshot = Passthrough<{
  reference: SnapshotReference;
  document: LibraryDocumentV2;
}>;

export const PERSISTED_JOB_STATES = [
  "queued",
  "paused",
  "interrupted",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type PersistedJobState = (typeof PERSISTED_JOB_STATES)[number];

export const SESSION_JOB_STATES = [...PERSISTED_JOB_STATES, "running"] as const;
export type SessionJobState = (typeof SESSION_JOB_STATES)[number];

export const JOB_PAUSE_REASONS = [
  "offline",
  "rate-limit",
  "user",
  "app-closed",
] as const;

export type JobPauseReason = (typeof JOB_PAUSE_REASONS)[number];

export type JobProgress = Passthrough<{
  processed: number;
  remaining: number;
  failed: number;
  total: number | null;
  message?: string;
}>;

export type JobErrorAggregate = Passthrough<{
  code: string;
  message: string;
  count: number;
  lastOccurredAt: IsoDateTime;
  retryable: boolean;
}>;

export type PersistedJob = Passthrough<{
  id: string;
  kind: string;
  state: PersistedJobState;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  payload: JsonObject;
  progress?: JobProgress;
  pauseReason?: JobPauseReason;
  nextAttemptAt?: IsoDateTime;
  retryAfterSeconds?: number;
  errors: JobErrorAggregate[];
}>;

/** running is legal only while an open app session owns execution. */
export type SessionJob = Omit<PersistedJob, "state"> & {
  state: SessionJobState;
};
