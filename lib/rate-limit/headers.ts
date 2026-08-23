import type { RateLimitService } from "./policies";
import { parseRetryAfter } from "./retry-after";

export type HeaderSource = Headers | Record<string, string | null | undefined>;

export type RateLimitObservation = {
  limited: boolean;
  limit?: number;
  remaining?: number;
  retryAt?: string;
  retryAfterSeconds?: number;
};

function readHeader(headers: HeaderSource, name: string): string | undefined {
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  const match = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  return match?.[1] ?? undefined;
}

function nonNegativeNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function resetEpochMs(value: string | undefined): number | undefined {
  const seconds = nonNegativeNumber(value);
  return seconds === undefined ? undefined : seconds * 1_000;
}

export function inspectRateLimitResponse(
  service: RateLimitService,
  status: number,
  headers: HeaderSource,
  nowMs = Date.now(),
): RateLimitObservation {
  const prefix = service === "twitch" ? "ratelimit" : "x-ratelimit";
  const limit = nonNegativeNumber(readHeader(headers, `${prefix}-limit`));
  const remaining = nonNegativeNumber(
    readHeader(headers, `${prefix}-remaining`),
  );
  const resetMs = resetEpochMs(readHeader(headers, `${prefix}-reset`));
  const retryDelayMs = parseRetryAfter(readHeader(headers, "retry-after"), nowMs);
  const effectiveDelayMs =
    retryDelayMs ??
    (status === 429 && resetMs !== undefined
      ? Math.max(0, resetMs - nowMs)
      : undefined);

  return {
    limited: status === 429 || remaining === 0,
    ...(limit !== undefined ? { limit } : {}),
    ...(remaining !== undefined ? { remaining } : {}),
    ...(effectiveDelayMs !== undefined
      ? {
          retryAt: new Date(nowMs + effectiveDelayMs).toISOString(),
          retryAfterSeconds: Math.ceil(effectiveDelayMs / 1_000),
        }
      : {}),
  };
}
