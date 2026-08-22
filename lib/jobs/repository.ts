import type { PersistedJob, SessionJob } from "../model";
import {
  rehydrateJob,
  toPersistedJob,
  type PersistableJobRecord,
  type RuntimeJob,
} from "./state";

export interface JobStorage {
  put(job: PersistedJob): Promise<void>;
  get(id: string): Promise<PersistableJobRecord | undefined>;
  list(): Promise<PersistableJobRecord[]>;
  delete(id: string): Promise<void>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class JobRepository {
  constructor(private readonly storage: JobStorage) {}

  async save(job: SessionJob): Promise<void> {
    await this.storage.put(toPersistedJob(job));
  }

  async get(id: string): Promise<RuntimeJob | undefined> {
    const record = await this.storage.get(id);
    return record ? rehydrateJob(record) : undefined;
  }

  async hydrate(): Promise<RuntimeJob[]> {
    const records = await this.storage.list();
    const jobs = records.map(rehydrateJob);
    await Promise.all(
      records.map((record, index) =>
        record.state === "running" ? this.save(jobs[index]) : Promise.resolve(),
      ),
    );
    return jobs;
  }

  async remove(id: string): Promise<void> {
    await this.storage.delete(id);
  }
}

export class MemoryJobStorage implements JobStorage {
  private readonly jobs = new Map<string, PersistableJobRecord>();

  constructor(seed: PersistableJobRecord[] = []) {
    for (const job of seed) this.jobs.set(job.id, clone(job));
  }

  async put(job: PersistedJob): Promise<void> {
    this.jobs.set(job.id, clone(job));
  }

  async get(id: string): Promise<PersistableJobRecord | undefined> {
    const job = this.jobs.get(id);
    return job ? clone(job) : undefined;
  }

  async list(): Promise<PersistableJobRecord[]> {
    return [...this.jobs.values()].map(clone);
  }

  async delete(id: string): Promise<void> {
    this.jobs.delete(id);
  }
}
