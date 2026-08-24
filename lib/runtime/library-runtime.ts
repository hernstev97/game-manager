import { UndoHistory } from "@/lib/history";
import { IndexedDbJobStorage, JobRepository, JobScheduler } from "@/lib/jobs";
import { IndexedDbSnapshotStorage } from "@/lib/persistence/snapshots-indexeddb";
import { SnapshotRepository } from "@/lib/persistence/snapshots";

export const libraryUndoHistory = new UndoHistory();

let snapshotRepository: SnapshotRepository | undefined;
let jobRepository: JobRepository | undefined;
let jobScheduler: JobScheduler | undefined;

export function getLibrarySnapshotRepository(): SnapshotRepository {
  snapshotRepository ??= new SnapshotRepository(new IndexedDbSnapshotStorage());
  return snapshotRepository;
}

export function getLibraryJobRepository(): JobRepository {
  jobRepository ??= new JobRepository(new IndexedDbJobStorage());
  return jobRepository;
}

export function getLibraryJobScheduler(): JobScheduler {
  jobScheduler ??= new JobScheduler(getLibraryJobRepository());
  return jobScheduler;
}
