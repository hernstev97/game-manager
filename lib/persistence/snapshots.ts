import type {
  BeforeImportSnapshotHook,
  LibraryDocumentV2,
  LibrarySnapshot,
  SnapshotReason,
  SnapshotReference,
} from "../model";
import {
  classifySnapshotError,
  SnapshotRepositoryError,
} from "./snapshots-errors";

export const DEFAULT_SNAPSHOT_RETENTION = 20;

export type SnapshotMetadata = {
  gameCount: number;
  viewCount: number;
  sizeBytes: number;
  protected: boolean;
};

export type StoredLibrarySnapshot = LibrarySnapshot & {
  metadata: SnapshotMetadata;
};

export interface SnapshotStorage {
  put(snapshot: StoredLibrarySnapshot): Promise<void>;
  get(id: string): Promise<StoredLibrarySnapshot | undefined>;
  list(): Promise<StoredLibrarySnapshot[]>;
  delete(id: string): Promise<void>;
}

export type SnapshotRepositoryOptions = {
  retention?: number;
  now?: () => Date;
  createId?: () => string;
};

export type CreateSnapshotOptions = {
  protected?: boolean;
  checksum?: string;
};

export type PreparedSnapshotRestore = {
  document: LibraryDocumentV2;
  source: SnapshotReference;
  safetySnapshot: SnapshotReference;
};

export function createBeforeImportSnapshotHook(
  repository: SnapshotRepository,
): BeforeImportSnapshotHook {
  return async ({ current }) =>
    (await repository.create("before-import", current)).reference;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function documentSize(document: LibraryDocumentV2): number {
  return new TextEncoder().encode(JSON.stringify(document)).byteLength;
}

export class SnapshotRepository {
  private readonly retention: number;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(
    private readonly storage: SnapshotStorage,
    options: SnapshotRepositoryOptions = {},
  ) {
    this.retention = Math.max(
      1,
      Math.floor(options.retention ?? DEFAULT_SNAPSHOT_RETENTION),
    );
    this.now = options.now ?? (() => new Date());
    this.createId =
      options.createId ??
      (() => globalThis.crypto?.randomUUID?.() ?? `snapshot-${Date.now()}`);
  }

  async create(
    reason: SnapshotReason,
    document: LibraryDocumentV2,
    options: CreateSnapshotOptions = {},
  ): Promise<StoredLibrarySnapshot> {
    try {
      const createdAt = this.now().toISOString();
      const snapshot: StoredLibrarySnapshot = {
        reference: {
          id: this.createId(),
          createdAt,
          reason,
          documentVersion: document.version,
          ...(options.checksum ? { checksum: options.checksum } : {}),
        },
        document: clone(document),
        metadata: {
          gameCount: document.games.length,
          viewCount: document.savedViews.length,
          sizeBytes: documentSize(document),
          protected: options.protected ?? reason === "manual",
        },
      };
      await this.storage.put(snapshot);
      await this.rotate();
      return clone(snapshot);
    } catch (error) {
      throw classifySnapshotError(error);
    }
  }

  async get(id: string): Promise<StoredLibrarySnapshot | undefined> {
    try {
      const snapshot = await this.storage.get(id);
      return snapshot ? clone(snapshot) : undefined;
    } catch (error) {
      throw classifySnapshotError(error);
    }
  }

  async list(): Promise<StoredLibrarySnapshot[]> {
    try {
      const snapshots = await this.storage.list();
      return snapshots
        .sort(
          (left, right) =>
            right.reference.createdAt.localeCompare(left.reference.createdAt) ||
            right.reference.id.localeCompare(left.reference.id),
        )
        .map(clone);
    } catch (error) {
      throw classifySnapshotError(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.storage.delete(id);
    } catch (error) {
      throw classifySnapshotError(error);
    }
  }

  async setProtected(id: string, protectedValue: boolean): Promise<void> {
    try {
      const snapshot = await this.storage.get(id);
      if (!snapshot) {
        throw new SnapshotRepositoryError("not-found", "Snapshot not found");
      }
      snapshot.metadata.protected = protectedValue;
      await this.storage.put(snapshot);
      await this.rotate();
    } catch (error) {
      throw classifySnapshotError(error);
    }
  }

  async prepareRestore(
    snapshotId: string,
    currentDocument: LibraryDocumentV2,
  ): Promise<PreparedSnapshotRestore> {
    const target = await this.get(snapshotId);
    if (!target) {
      throw new SnapshotRepositoryError("not-found", "Snapshot not found");
    }
    const safety = await this.create("before-restore", currentDocument, {
      protected: true,
    });
    return {
      document: clone(target.document),
      source: clone(target.reference),
      safetySnapshot: clone(safety.reference),
    };
  }

  private async rotate(): Promise<void> {
    const snapshots = await this.storage.list();
    const candidates = snapshots
      .filter((snapshot) => !snapshot.metadata.protected)
      .sort(
        (left, right) =>
          left.reference.createdAt.localeCompare(right.reference.createdAt) ||
          left.reference.id.localeCompare(right.reference.id),
      );
    const excess = candidates.length - this.retention;
    for (const snapshot of candidates.slice(0, Math.max(0, excess))) {
      await this.storage.delete(snapshot.reference.id);
    }
  }
}
