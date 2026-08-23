import type { JobErrorAggregate, JobPauseReason, SessionJobState } from "@/lib/model";
import { sanitizeDiagnosticText } from "@/lib/jobs/errors";
import type { RuntimeJob } from "@/lib/jobs/state";

export type EffectiveJobStatus =
  | "running"
  | "queued"
  | "offline"
  | "rate-limit"
  | "user-paused"
  | "interrupted"
  | "succeeded"
  | "failed"
  | "cancelled";

export type PresentedJobProgress = {
  processed: number;
  remaining: number;
  failed: number;
  completed: number;
  total: number | null;
  percent: number | null;
};

export type PresentedJobError = {
  code: string;
  message: string;
  count: number;
  lastOccurredAt: string;
  retryable: boolean;
};

export type TaskCenterSummary = {
  totalJobs: number;
  running: number;
  waiting: number;
  failed: number;
  succeeded: number;
  cancelled: number;
  offlinePaused: number;
  rateLimitPaused: number;
  active: number;
  progress: PresentedJobProgress;
};

const STATUS_PRIORITY: Record<EffectiveJobStatus, number> = {
  running: 0,
  offline: 1,
  "rate-limit": 2,
  queued: 3,
  interrupted: 4,
  "user-paused": 5,
  failed: 6,
  succeeded: 7,
  cancelled: 8,
};

const ACTIVE_STATES = new Set<SessionJobState>([
  "running",
  "queued",
  "paused",
  "interrupted",
]);

function nonNegativeInteger(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

function timestamp(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusForPauseReason(reason: JobPauseReason | undefined): EffectiveJobStatus {
  if (reason === "offline") return "offline";
  if (reason === "rate-limit") return "rate-limit";
  if (reason === "app-closed") return "interrupted";
  return "user-paused";
}

export function deriveJobStatus(job: RuntimeJob, isOnline: boolean): EffectiveJobStatus {
  if (job.state === "succeeded" || job.state === "failed" || job.state === "cancelled") {
    return job.state;
  }
  if (job.state === "interrupted") return "interrupted";
  if (!isOnline && ACTIVE_STATES.has(job.state)) return "offline";
  if (job.state === "paused") return statusForPauseReason(job.pauseReason);
  return job.state;
}

export function presentJobProgress(job: Pick<RuntimeJob, "progress">): PresentedJobProgress {
  const processed = nonNegativeInteger(job.progress?.processed);
  const remaining = nonNegativeInteger(job.progress?.remaining);
  const failed = nonNegativeInteger(job.progress?.failed);
  const observedCompleted = processed + failed;
  const declaredTotal = job.progress?.total;
  if (declaredTotal === null || declaredTotal === undefined || !Number.isFinite(declaredTotal)) {
    return {
      processed,
      remaining,
      failed,
      completed: observedCompleted,
      total: null,
      percent: null,
    };
  }

  const total = Math.max(nonNegativeInteger(declaredTotal), observedCompleted + remaining);
  const completed = Math.min(total, Math.max(observedCompleted, total - remaining));
  return {
    processed,
    remaining,
    failed,
    completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
  };
}

export function aggregateJobErrors(
  errors: readonly JobErrorAggregate[],
): PresentedJobError[] {
  const byCode = new Map<string, PresentedJobError>();
  for (const error of errors) {
    const code = sanitizeDiagnosticText(error.code || "unbekannter-fehler");
    const message = sanitizeDiagnosticText(error.message || "Keine Fehlerbeschreibung verfügbar.");
    const current = byCode.get(code);
    const count = Math.max(1, nonNegativeInteger(error.count));
    if (!current) {
      byCode.set(code, {
        code,
        message,
        count,
        lastOccurredAt: error.lastOccurredAt,
        retryable: error.retryable,
      });
      continue;
    }
    current.count += count;
    if (timestamp(error.lastOccurredAt) >= timestamp(current.lastOccurredAt)) {
      current.message = message;
      current.lastOccurredAt = error.lastOccurredAt;
      current.retryable = error.retryable;
    }
  }
  return [...byCode.values()].sort(
    (left, right) => timestamp(right.lastOccurredAt) - timestamp(left.lastOccurredAt),
  );
}

export function getNextAttemptAt(
  job: Pick<RuntimeJob, "nextAttemptAt" | "retryAfterSeconds" | "updatedAt">,
): string | null {
  if (Number.isFinite(timestamp(job.nextAttemptAt)) && timestamp(job.nextAttemptAt) > 0) {
    return job.nextAttemptAt ?? null;
  }
  const updatedAt = timestamp(job.updatedAt);
  if (
    updatedAt === 0
    || job.retryAfterSeconds === undefined
    || !Number.isFinite(job.retryAfterSeconds)
    || job.retryAfterSeconds < 0
  ) return null;
  const retryAfterSeconds = nonNegativeInteger(job.retryAfterSeconds);
  return new Date(updatedAt + retryAfterSeconds * 1_000).toISOString();
}

export function formatNextAttempt(
  job: Pick<RuntimeJob, "nextAttemptAt" | "retryAfterSeconds" | "updatedAt">,
  nowMs?: number,
  locale = "de-DE",
): { dateTime: string; label: string } | null {
  const dateTime = getNextAttemptAt(job);
  if (!dateTime) return null;
  const retryAt = timestamp(dateTime);
  if (retryAt === 0) return null;
  const absolute = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(retryAt));
  if (nowMs === undefined) return { dateTime, label: absolute };
  const seconds = Math.max(0, Math.ceil((retryAt - nowMs) / 1_000));
  const relative = seconds === 0
    ? "jetzt"
    : seconds < 60
      ? `in ${seconds} s`
      : seconds < 3_600
        ? `in ${Math.ceil(seconds / 60)} min`
        : `in ${Math.ceil(seconds / 3_600)} h`;
  return { dateTime, label: `${relative} (${absolute})` };
}

export function sortJobsForDisplay(
  jobs: readonly RuntimeJob[],
  isOnline: boolean,
): RuntimeJob[] {
  return [...jobs].sort((left, right) => {
    const priority = STATUS_PRIORITY[deriveJobStatus(left, isOnline)]
      - STATUS_PRIORITY[deriveJobStatus(right, isOnline)];
    if (priority !== 0) return priority;
    const recent = timestamp(right.updatedAt) - timestamp(left.updatedAt);
    return recent !== 0 ? recent : left.id.localeCompare(right.id);
  });
}

export function summarizeJobs(
  jobs: readonly RuntimeJob[],
  isOnline: boolean,
): TaskCenterSummary {
  const summary: TaskCenterSummary = {
    totalJobs: jobs.length,
    running: 0,
    waiting: 0,
    failed: 0,
    succeeded: 0,
    cancelled: 0,
    offlinePaused: 0,
    rateLimitPaused: 0,
    active: 0,
    progress: {
      processed: 0,
      remaining: 0,
      failed: 0,
      completed: 0,
      total: jobs.length === 0 ? null : 0,
      percent: null,
    },
  };
  let allTotalsKnown = jobs.length > 0;
  for (const job of jobs) {
    const status = deriveJobStatus(job, isOnline);
    if (status === "running") summary.running += 1;
    else if (status === "failed") summary.failed += 1;
    else if (status === "succeeded") summary.succeeded += 1;
    else if (status === "cancelled") summary.cancelled += 1;
    else summary.waiting += 1;
    if (status === "offline") summary.offlinePaused += 1;
    if (status === "rate-limit") summary.rateLimitPaused += 1;
    if (ACTIVE_STATES.has(job.state)) summary.active += 1;

    const progress = presentJobProgress(job);
    summary.progress.processed += progress.processed;
    summary.progress.remaining += progress.remaining;
    summary.progress.failed += progress.failed;
    summary.progress.completed += progress.completed;
    if (progress.total === null) {
      allTotalsKnown = false;
    } else {
      summary.progress.total = (summary.progress.total ?? 0) + progress.total;
    }
  }
  if (!allTotalsKnown) summary.progress.total = null;
  if (summary.progress.total !== null) {
    summary.progress.percent = summary.progress.total === 0
      ? 100
      : Math.round((summary.progress.completed / summary.progress.total) * 100);
  }
  return summary;
}

export function defaultJobLabel(job: Pick<RuntimeJob, "kind">): string {
  const known: Record<string, string> = {
    "metadata-refresh": "Metadaten aktualisieren",
    metadata: "Metadaten aktualisieren",
  };
  return known[job.kind] ?? `Aufgabe „${sanitizeDiagnosticText(job.kind)}“`;
}

export function jobStatusLabel(status: EffectiveJobStatus): string {
  const labels: Record<EffectiveJobStatus, string> = {
    running: "Läuft",
    queued: "Wartet",
    offline: "Offline pausiert",
    "rate-limit": "Durch Rate-Limit pausiert",
    "user-paused": "Pausiert",
    interrupted: "Beim Schließen unterbrochen",
    succeeded: "Abgeschlossen",
    failed: "Fehlgeschlagen",
    cancelled: "Abgebrochen",
  };
  return labels[status];
}
