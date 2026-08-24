import type { JobProgress, SessionJob } from "../model";
import {
  DEFAULT_SERVICE_POLICIES,
  type RateLimitService,
  type RetryPolicy,
  type ServiceRateLimitPolicy,
} from "../rate-limit";
import { sanitizeJobFailure, type SanitizedJobFailure } from "./errors";
import { transitionJobFailure } from "./failure";
import type { JobRepository } from "./repository";
import type {
  JobDefinitionOptions,
  JobSchedulerOptions,
  JobTask,
} from "./scheduler-types";
import {
  cancelJob,
  normalizeJobProgress,
  pauseJob,
  resumeJob,
  type RuntimeJob,
} from "./state";

const DEFAULT_JOB_RETRY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitterRatio: 0.2,
};

type JobDefinition = JobDefinitionOptions & { task: JobTask };
type ActiveJob = {
  controller: AbortController;
  service?: RateLimitService;
  promise: Promise<void>;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Session-bound scheduler. It never claims work continues after shutdown. */
export class JobScheduler {
  private readonly concurrency: number;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly policies: Record<RateLimitService, ServiceRateLimitPolicy>;
  private readonly jobs = new Map<string, RuntimeJob>();
  private readonly definitions = new Map<string, JobDefinition>();
  private readonly active = new Map<string, ActiveJob>();
  private readonly nextServiceStart = new Map<RateLimitService, number>();
  private online = true;
  private started = false;
  private wakeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly repository: JobRepository,
    options: JobSchedulerOptions = {},
  ) {
    this.concurrency = Math.max(1, Math.floor(options.concurrency ?? 2));
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
    this.policies = { ...DEFAULT_SERVICE_POLICIES, ...options.servicePolicies };
  }

  register(kind: string, task: JobTask, options: JobDefinitionOptions = {}): void {
    this.definitions.set(kind, { task, ...options });
  }

  async hydrate(): Promise<RuntimeJob[]> {
    const hydrated = await this.repository.hydrate();
    for (const job of hydrated) this.jobs.set(job.id, clone(job));
    return this.list();
  }

  async enqueue(job: SessionJob): Promise<void> {
    const queued = clone(job) as RuntimeJob;
    if (queued.state === "running") queued.state = "interrupted";
    this.jobs.set(queued.id, queued);
    await this.repository.save(queued);
    this.pump();
  }

  async start(): Promise<void> {
    this.started = true;
    const resumed: RuntimeJob[] = [];
    for (const [id, job] of this.jobs) {
      if (job.state !== "interrupted") continue;
      const next = resumeJob(job, this.isoNow());
      this.jobs.set(id, next);
      resumed.push(next);
    }
    await Promise.all(resumed.map((job) => this.repository.save(job)));
    this.pump();
  }

  get(id: string): RuntimeJob | undefined {
    const job = this.jobs.get(id);
    return job ? clone(job) : undefined;
  }

  list(): RuntimeJob[] {
    return [...this.jobs.values()]
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(clone);
  }

  async setOnline(online: boolean): Promise<void> {
    if (this.online === online) return;
    this.online = online;
    this.clearWakeTimer();
    const changed: RuntimeJob[] = [];
    for (const [id, job] of this.jobs) {
      if (!online && (job.state === "queued" || job.state === "running")) {
        const paused = pauseJob(job, "offline", this.isoNow());
        this.jobs.set(id, paused);
        this.active.get(id)?.controller.abort();
        changed.push(paused);
      } else if (online && job.state === "paused" && job.pauseReason === "offline") {
        const queued = resumeJob(job, this.isoNow(), {
          preserveRetrySchedule: true,
        });
        this.jobs.set(id, queued);
        changed.push(queued);
      }
    }
    await Promise.all(changed.map((job) => this.repository.save(job)));
    this.pump();
  }

  async cancel(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || ["succeeded", "cancelled"].includes(job.state)) return false;
    const cancelled = cancelJob(job, this.isoNow());
    this.jobs.set(id, cancelled);
    this.active.get(id)?.controller.abort();
    await this.repository.save(cancelled);
    this.pump();
    return true;
  }

  async retry(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.state !== "failed") return false;
    const queued = resumeJob(job, this.isoNow());
    this.jobs.set(id, queued);
    await this.repository.save(queued);
    this.pump();
    return true;
  }

  async shutdown(): Promise<void> {
    this.started = false;
    this.clearWakeTimer();
    const interrupted: RuntimeJob[] = [];
    for (const [id, active] of this.active) {
      const job = this.jobs.get(id);
      if (job?.state === "running") {
        const next: RuntimeJob = {
          ...clone(job),
          state: "interrupted" as const,
          pauseReason: "app-closed" as const,
          updatedAt: this.isoNow(),
        };
        this.jobs.set(id, next);
        interrupted.push(next);
      }
      active.controller.abort();
    }
    await Promise.all(interrupted.map((job) => this.repository.save(job)));
  }

  async waitForIdle(): Promise<void> {
    while (this.active.size > 0) {
      await Promise.allSettled([...this.active.values()].map((item) => item.promise));
    }
  }

  private pump(): void {
    if (!this.started || !this.online) return;
    this.activateDueRetries();
    let candidate = this.nextCandidate();
    while (candidate && this.active.size < this.concurrency) {
      this.launch(candidate.job, candidate.definition);
      candidate = this.nextCandidate();
    }
    this.scheduleWake();
  }

  private nextCandidate(): { job: RuntimeJob; definition: JobDefinition } | undefined {
    const now = this.now();
    for (const job of this.jobs.values()) {
      if (job.state !== "queued") continue;
      if (job.nextAttemptAt && Date.parse(job.nextAttemptAt) > now) continue;
      const definition = this.definitions.get(job.kind);
      if (!definition) continue;
      if (definition.service && !this.serviceSlotAvailable(definition.service, now)) continue;
      return { job, definition };
    }
    return undefined;
  }

  private serviceSlotAvailable(service: RateLimitService, now: number): boolean {
    const active = [...this.active.values()].filter((item) => item.service === service).length;
    return (
      active < this.policies[service].maxConcurrency &&
      now >= (this.nextServiceStart.get(service) ?? 0)
    );
  }

  private launch(job: RuntimeJob, definition: JobDefinition): void {
    const controller = new AbortController();
    const running: RuntimeJob = {
      ...clone(job),
      state: "running",
      updatedAt: this.isoNow(),
    };
    delete running.pauseReason;
    delete running.nextAttemptAt;
    delete running.retryAfterSeconds;
    this.jobs.set(job.id, running);
    if (definition.service) {
      this.nextServiceStart.set(
        definition.service,
        this.now() + this.policies[definition.service].minIntervalMs,
      );
    }
    const promise = this.execute(running, definition, controller).finally(() => {
      this.active.delete(job.id);
      this.pump();
    });
    this.active.set(job.id, { controller, service: definition.service, promise });
  }

  private async execute(
    job: RuntimeJob,
    definition: JobDefinition,
    controller: AbortController,
  ): Promise<void> {
    await this.repository.save(job);
    try {
      await definition.task({
        job: clone(job),
        signal: controller.signal,
        reportProgress: (progress) => this.reportProgress(job.id, progress),
      });
      const current = this.jobs.get(job.id);
      if (current?.state !== "running") return;
      const succeeded = { ...current, state: "succeeded" as const, updatedAt: this.isoNow() };
      this.jobs.set(job.id, succeeded);
      await this.repository.save(succeeded);
    } catch (error) {
      await this.handleFailure(job.id, definition, sanitizeJobFailure(error));
    }
  }

  private async reportProgress(id: string, progress: JobProgress): Promise<void> {
    const job = this.jobs.get(id);
    if (job?.state !== "running") return;
    const updated: RuntimeJob = {
      ...job,
      progress: normalizeJobProgress(progress),
      updatedAt: this.isoNow(),
    };
    this.jobs.set(id, updated);
    await this.repository.save(updated);
  }

  private async handleFailure(
    id: string,
    definition: JobDefinition,
    failure: SanitizedJobFailure,
  ): Promise<void> {
    const job = this.jobs.get(id);
    if (job?.state !== "running") return;
    const policy = definition.retry ??
      (definition.service ? this.policies[definition.service].retry : DEFAULT_JOB_RETRY);
    const nowMs = this.now();
    const waiting = transitionJobFailure(job, failure, {
      policy,
      service: definition.service,
      nowMs,
      occurredAt: new Date(nowMs).toISOString(),
      random: this.random,
    });
    this.jobs.set(id, waiting);
    await this.repository.save(waiting);
  }

  private activateDueRetries(): void {
    const now = this.now();
    for (const [id, job] of this.jobs) {
      if (
        job.state === "paused" &&
        job.pauseReason === "rate-limit" &&
        job.nextAttemptAt &&
        Date.parse(job.nextAttemptAt) <= now
      ) {
        const queued: RuntimeJob = { ...job, state: "queued" };
        delete queued.pauseReason;
        this.jobs.set(id, queued);
        void this.repository.save(queued);
      }
    }
  }

  private scheduleWake(): void {
    this.clearWakeTimer();
    const now = this.now();
    const times = [...this.jobs.values()]
      .filter((job) => job.state === "queued" || job.pauseReason === "rate-limit")
      .map((job) => (job.nextAttemptAt ? Date.parse(job.nextAttemptAt) : Infinity));
    for (const serviceStart of this.nextServiceStart.values()) times.push(serviceStart);
    const next = Math.min(...times.filter((time) => Number.isFinite(time) && time > now));
    if (Number.isFinite(next)) {
      this.wakeTimer = setTimeout(() => this.pump(), Math.max(1, next - now));
    }
  }

  private clearWakeTimer(): void {
    if (this.wakeTimer) clearTimeout(this.wakeTimer);
    this.wakeTimer = undefined;
  }

  private isoNow(): string {
    return new Date(this.now()).toISOString();
  }
}
