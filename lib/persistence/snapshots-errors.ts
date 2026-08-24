export type SnapshotErrorCode =
  | "quota-exceeded"
  | "storage-unavailable"
  | "serialization-failed"
  | "transaction-failed"
  | "not-found"
  | "unknown";

export class SnapshotRepositoryError extends Error {
  readonly code: SnapshotErrorCode;

  constructor(code: SnapshotErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SnapshotRepositoryError";
    this.code = code;
  }
}

function errorName(error: unknown): string {
  if (!error || typeof error !== "object" || !("name" in error)) return "";
  return String(error.name);
}

export function classifySnapshotError(error: unknown): SnapshotRepositoryError {
  if (error instanceof SnapshotRepositoryError) return error;
  const name = errorName(error);
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new SnapshotRepositoryError(
      "quota-exceeded",
      "Snapshot storage quota was exceeded",
      { cause: error },
    );
  }
  if (
    name === "InvalidStateError" ||
    name === "NotSupportedError" ||
    name === "SecurityError"
  ) {
    return new SnapshotRepositoryError(
      "storage-unavailable",
      "Snapshot storage is unavailable",
      { cause: error },
    );
  }
  if (error instanceof TypeError && /circular|serialize|JSON/i.test(error.message)) {
    return new SnapshotRepositoryError(
      "serialization-failed",
      "The library document could not be serialized",
      { cause: error },
    );
  }
  if (name === "AbortError" || name === "TransactionInactiveError") {
    return new SnapshotRepositoryError(
      "transaction-failed",
      "The snapshot transaction failed",
      { cause: error },
    );
  }
  return new SnapshotRepositoryError("unknown", "Snapshot storage failed", {
    cause: error,
  });
}
