import type {
  JobErrorAggregate,
  JobPauseReason,
  JobProgress,
  JsonObject,
  PersistedJob,
  PersistedJobState,
  SessionJob,
  SessionJobState,
} from "../model";

type KnownJobFields = Pick<
  PersistedJob,
  | "id"
  | "kind"
  | "createdAt"
  | "updatedAt"
  | "payload"
  | "progress"
  | "pauseReason"
  | "nextAttemptAt"
  | "retryAfterSeconds"
  | "errors"
>;

/** Restores the known fields lost by Omit over the passthrough model type. */
export type RuntimeJob = SessionJob & KnownJobFields & { state: SessionJobState };

export type PersistableJobRecord = KnownJobFields & {
  state: PersistedJobState | "running";
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createQueuedJob(input: {
  id: string;
  kind: string;
  payload: JsonObject;
  createdAt?: string;
  progress?: JobProgress;
}): RuntimeJob {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    id: input.id,
    kind: input.kind,
    state: "queued",
    createdAt,
    updatedAt: createdAt,
    payload: clone(input.payload),
    ...(input.progress ? { progress: clone(input.progress) } : {}),
    errors: [],
  };
}

export function rehydrateJob(record: PersistableJobRecord): RuntimeJob {
  const job = clone(record) as RuntimeJob;
  if (record.state === "running") {
    job.state = "interrupted";
    job.pauseReason = "app-closed";
  }
  return job;
}

export function toPersistedJob(job: SessionJob): PersistedJob {
  const persisted = clone(job) as PersistedJob;
  if (job.state === "running") {
    persisted.state = "interrupted";
  }
  return persisted;
}

export function pauseJob(
  job: RuntimeJob,
  reason: JobPauseReason,
  updatedAt: string,
): RuntimeJob {
  return { ...clone(job), state: "paused", pauseReason: reason, updatedAt };
}

export function resumeJob(
  job: RuntimeJob,
  updatedAt: string,
  options: { preserveRetrySchedule?: boolean } = {},
): RuntimeJob {
  const resumed: RuntimeJob = { ...clone(job), state: "queued", updatedAt };
  delete resumed.pauseReason;
  if (!options.preserveRetrySchedule) {
    delete resumed.nextAttemptAt;
    delete resumed.retryAfterSeconds;
  }
  return resumed;
}

export function cancelJob(job: RuntimeJob, updatedAt: string): RuntimeJob {
  const cancelled: RuntimeJob = { ...clone(job), state: "cancelled", updatedAt };
  delete cancelled.pauseReason;
  delete cancelled.nextAttemptAt;
  delete cancelled.retryAfterSeconds;
  return cancelled;
}

export function normalizeJobProgress(progress: JobProgress): JobProgress {
  const integer = (value: number) => Math.max(0, Math.floor(value));
  return {
    ...clone(progress),
    processed: integer(progress.processed),
    remaining: integer(progress.remaining),
    failed: integer(progress.failed),
    total: progress.total === null ? null : integer(progress.total),
  };
}

export function retryableErrorCount(errors: readonly JobErrorAggregate[]): number {
  return errors.reduce(
    (total, error) => total + (error.retryable ? error.count : 0),
    0,
  );
}
