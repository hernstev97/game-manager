import type { JobErrorAggregate } from "../model";
import type { HeaderSource } from "../rate-limit";

const SECRET_ASSIGNMENT =
  /\b(api[_-]?key|access[_-]?token|client[_-]?secret|authorization|password|secret|token)\s*[:=]\s*[^\s&,;]+/gi;
const BEARER_TOKEN = /\bBearer\s+[^\s,;]+/gi;
const URL = /https?:\/\/[^\s<>'"`]+/gi;

export function sanitizeDiagnosticText(value: string): string {
  return value
    .replace(URL, (candidate) => {
      try {
        return `[redacted-url:${new globalThis.URL(candidate).hostname}]`;
      } catch {
        return "[redacted-url]";
      }
    })
    .replace(BEARER_TOKEN, "Bearer [redacted]")
    .replace(SECRET_ASSIGNMENT, (_, key: string) => `${key}=[redacted]`)
    .slice(0, 500);
}

export class JobTaskError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly status?: number;
  readonly headers?: HeaderSource;

  constructor(
    message: string,
    options: {
      code?: string;
      retryable?: boolean;
      status?: number;
      headers?: HeaderSource;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "JobTaskError";
    this.code = options.code ?? "task-failed";
    this.retryable = options.retryable ?? false;
    this.status = options.status;
    this.headers = options.headers;
  }
}

export type SanitizedJobFailure = {
  code: string;
  message: string;
  retryable: boolean;
  status?: number;
  headers?: HeaderSource;
};

export function sanitizeJobFailure(error: unknown): SanitizedJobFailure {
  if (error instanceof JobTaskError) {
    return {
      code: error.code.replace(/[^a-z0-9._-]/gi, "-").slice(0, 80),
      message: sanitizeDiagnosticText(error.message),
      retryable: error.retryable,
      ...(error.status !== undefined ? { status: error.status } : {}),
      ...(error.headers ? { headers: error.headers } : {}),
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    code: "unexpected-error",
    message: sanitizeDiagnosticText(message),
    retryable: false,
  };
}

export function aggregateJobError(
  errors: readonly JobErrorAggregate[],
  failure: Pick<SanitizedJobFailure, "code" | "message" | "retryable">,
  occurredAt: string,
): JobErrorAggregate[] {
  const next = errors.map((error) => ({ ...error }));
  const existing = next.find((error) => error.code === failure.code);
  if (existing) {
    existing.count += 1;
    existing.message = failure.message;
    existing.lastOccurredAt = occurredAt;
    existing.retryable = failure.retryable;
  } else {
    next.push({
      code: failure.code,
      message: failure.message,
      count: 1,
      lastOccurredAt: occurredAt,
      retryable: failure.retryable,
    });
  }
  return next;
}
