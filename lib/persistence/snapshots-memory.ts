import type { SnapshotStorage, StoredLibrarySnapshot } from "./snapshots";

export type MemorySnapshotStorageOptions = {
  quotaBytes?: number;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function bytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export class MemorySnapshotStorage implements SnapshotStorage {
  private readonly snapshots = new Map<string, StoredLibrarySnapshot>();

  constructor(private readonly options: MemorySnapshotStorageOptions = {}) {}

  async put(snapshot: StoredLibrarySnapshot): Promise<void> {
    const existing = this.snapshots.get(snapshot.reference.id);
    const currentSize = [...this.snapshots.values()].reduce(
      (total, item) => total + bytes(item),
      0,
    );
    const projectedSize = currentSize - (existing ? bytes(existing) : 0) + bytes(snapshot);
    if (
      this.options.quotaBytes !== undefined &&
      projectedSize > this.options.quotaBytes
    ) {
      throw new DOMException("Snapshot quota exceeded", "QuotaExceededError");
    }
    this.snapshots.set(snapshot.reference.id, clone(snapshot));
  }

  async get(id: string): Promise<StoredLibrarySnapshot | undefined> {
    const snapshot = this.snapshots.get(id);
    return snapshot ? clone(snapshot) : undefined;
  }

  async list(): Promise<StoredLibrarySnapshot[]> {
    return [...this.snapshots.values()].map(clone);
  }

  async delete(id: string): Promise<void> {
    this.snapshots.delete(id);
  }
}
