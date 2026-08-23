import type {
  LibraryDocumentV2,
  UndoChange,
  UndoTransaction,
} from "../model";

export const DEFAULT_UNDO_LIMIT = 50;

export type DocumentUndoTransaction = UndoTransaction & {
  beforeDocument: LibraryDocumentV2;
  afterDocument: LibraryDocumentV2;
};

export type UndoHistoryOptions = {
  limit?: number;
  now?: () => Date;
  createId?: () => string;
};

export type UndoResult = {
  document: LibraryDocumentV2;
  transaction: DocumentUndoTransaction;
};

export class UndoStateConflictError extends Error {
  constructor(direction: "undo" | "redo") {
    super(`Cannot ${direction}: the current document no longer matches the transaction`);
    this.name = "UndoStateConflictError";
  }
}

function cloneDocument(document: LibraryDocumentV2): LibraryDocumentV2 {
  return JSON.parse(JSON.stringify(document)) as LibraryDocumentV2;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function documentsEqual(
  left: LibraryDocumentV2,
  right: LibraryDocumentV2,
): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

export class UndoHistory {
  private readonly limit: number;
  private readonly now: () => Date;
  private readonly createId: () => string;
  private past: DocumentUndoTransaction[] = [];
  private future: DocumentUndoTransaction[] = [];

  constructor(options: UndoHistoryOptions = {}) {
    this.limit = Math.max(1, Math.floor(options.limit ?? DEFAULT_UNDO_LIMIT));
    this.now = options.now ?? (() => new Date());
    this.createId =
      options.createId ??
      (() => globalThis.crypto?.randomUUID?.() ?? `undo-${Date.now()}`);
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get undoCount(): number {
    return this.past.length;
  }

  get redoCount(): number {
    return this.future.length;
  }

  record(
    label: string,
    before: LibraryDocumentV2,
    after: LibraryDocumentV2,
    changes: UndoChange[] = [],
  ): DocumentUndoTransaction | null {
    if (documentsEqual(before, after)) return null;
    const transaction: DocumentUndoTransaction = {
      id: this.createId(),
      label,
      createdAt: this.now().toISOString(),
      changes: JSON.parse(JSON.stringify(changes)) as UndoChange[],
      beforeDocument: cloneDocument(before),
      afterDocument: cloneDocument(after),
    };
    this.push(transaction);
    return cloneTransaction(transaction);
  }

  push(transaction: DocumentUndoTransaction): void {
    this.past.push(cloneTransaction(transaction));
    if (this.past.length > this.limit) {
      this.past.splice(0, this.past.length - this.limit);
    }
    this.future = [];
  }

  undo(current: LibraryDocumentV2): UndoResult | null {
    const transaction = this.past.at(-1);
    if (!transaction) return null;
    if (!documentsEqual(current, transaction.afterDocument)) {
      throw new UndoStateConflictError("undo");
    }
    this.past.pop();
    this.future.push(transaction);
    return {
      document: cloneDocument(transaction.beforeDocument),
      transaction: cloneTransaction(transaction),
    };
  }

  redo(current: LibraryDocumentV2): UndoResult | null {
    const transaction = this.future.at(-1);
    if (!transaction) return null;
    if (!documentsEqual(current, transaction.beforeDocument)) {
      throw new UndoStateConflictError("redo");
    }
    this.future.pop();
    this.past.push(transaction);
    return {
      document: cloneDocument(transaction.afterDocument),
      transaction: cloneTransaction(transaction),
    };
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}

function cloneTransaction(
  transaction: DocumentUndoTransaction,
): DocumentUndoTransaction {
  return JSON.parse(JSON.stringify(transaction)) as DocumentUndoTransaction;
}
