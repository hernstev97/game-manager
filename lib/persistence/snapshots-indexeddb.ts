import type { SnapshotStorage, StoredLibrarySnapshot } from "./snapshots";

const DATABASE_NAME = "ggrid-snapshots";
const DATABASE_VERSION = 1;
const STORE_NAME = "snapshots";

export type IndexedDbSnapshotStorageOptions = {
  databaseName?: string;
  indexedDB?: IDBFactory;
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB failed"));
  });
}

export class IndexedDbSnapshotStorage implements SnapshotStorage {
  private readonly factory?: IDBFactory;
  private readonly databaseName: string;
  private databasePromise?: Promise<IDBDatabase>;

  constructor(options: IndexedDbSnapshotStorageOptions = {}) {
    const factory = options.indexedDB ?? globalThis.indexedDB;
    this.factory = factory;
    this.databaseName = options.databaseName ?? DATABASE_NAME;
  }

  async put(snapshot: StoredLibrarySnapshot): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(snapshot);
    await transactionDone(transaction);
  }

  async get(id: string): Promise<StoredLibrarySnapshot | undefined> {
    const database = await this.database();
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(id) as IDBRequest<StoredLibrarySnapshot | undefined>;
    return requestResult(request);
  }

  async list(): Promise<StoredLibrarySnapshot[]> {
    const database = await this.database();
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll() as IDBRequest<StoredLibrarySnapshot[]>;
    return requestResult(request);
  }

  async delete(id: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    await transactionDone(transaction);
  }

  async close(): Promise<void> {
    const database = await this.databasePromise;
    database?.close();
    this.databasePromise = undefined;
  }

  private database(): Promise<IDBDatabase> {
    const factory = this.factory;
    if (!factory) {
      return Promise.reject(
        new DOMException("IndexedDB is unavailable", "NotSupportedError"),
      );
    }
    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = factory.open(this.databaseName, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, {
            keyPath: "reference.id",
          });
          store.createIndex("createdAt", "reference.createdAt");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
      request.onblocked = () => reject(new Error("IndexedDB open blocked"));
    });
    return this.databasePromise;
  }
}
