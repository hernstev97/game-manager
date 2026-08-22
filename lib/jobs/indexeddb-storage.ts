import type { PersistedJob } from "../model";
import type { JobStorage } from "./repository";
import type { PersistableJobRecord } from "./state";

const DATABASE_NAME = "ggrid-jobs";
const DATABASE_VERSION = 1;
const STORE_NAME = "jobs";

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB failed"));
  });
}

export class IndexedDbJobStorage implements JobStorage {
  private readonly factory: IDBFactory;
  private databasePromise?: Promise<IDBDatabase>;

  constructor(
    private readonly databaseName = DATABASE_NAME,
    indexedDBFactory: IDBFactory | undefined = globalThis.indexedDB,
  ) {
    if (!indexedDBFactory) {
      throw new DOMException("IndexedDB is unavailable", "NotSupportedError");
    }
    this.factory = indexedDBFactory;
  }

  async put(job: PersistedJob): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(job);
    await completed(transaction);
  }

  async get(id: string): Promise<PersistableJobRecord | undefined> {
    const database = await this.database();
    return result(
      database.transaction(STORE_NAME).objectStore(STORE_NAME).get(id) as IDBRequest<
        PersistableJobRecord | undefined
      >,
    );
  }

  async list(): Promise<PersistableJobRecord[]> {
    const database = await this.database();
    return result(
      database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll() as IDBRequest<
        PersistableJobRecord[]
      >,
    );
  }

  async delete(id: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    await completed(transaction);
  }

  async close(): Promise<void> {
    const database = await this.databasePromise;
    database?.close();
    this.databasePromise = undefined;
  }

  private database(): Promise<IDBDatabase> {
    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = this.factory.open(this.databaseName, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
      request.onblocked = () => reject(new Error("IndexedDB open blocked"));
    });
    return this.databasePromise;
  }
}
