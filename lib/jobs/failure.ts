import {
  inspectRateLimitResponse,
  type RateLimitService,
  type RetryPolicy,
} from "../rate-limit";
import {
  aggregateJobError,
  type SanitizedJobFailure,
} from "./errors";
import { calculateBackoffDelay } from "./retry";
import { retryableErrorCount, type RuntimeJob } from "./state";

export type FailureTransitionOptions = {
  policy: RetryPolicy;
  service?: RateLimitService;
  nowMs: number;
  occurredAt: string;
  random: () => number;
};

export function transitionJobFailure(
  job: RuntimeJob,
  failure: SanitizedJobFailure,
  options: FailureTransitionOptions,
): RuntimeJob {
  const errors = aggregateJobError(job.errors, failure, options.occurredAt);
  const attempt = retryableErrorCount(errors);
  if (!failure.retryable || attempt >= options.policy.maxAttempts) {
    return {
      ...job,
      state: "failed",
      errors,
      updatedAt: options.occurredAt,
    };
  }

  const observation =
    options.service && failure.status !== undefined
      ? inspectRateLimitResponse(
          options.service,
          failure.status,
          failure.headers ?? {},
          options.nowMs,
        )
      : undefined;
  const delay =
    observation?.retryAfterSeconds !== undefined
      ? observation.retryAfterSeconds * 1_000
      : calculateBackoffDelay(attempt, options.policy, options.random);
  const rateLimited = failure.status === 429 || observation?.limited === true;
  const waiting: RuntimeJob = {
    ...job,
    state: rateLimited ? "paused" : "queued",
    ...(rateLimited ? { pauseReason: "rate-limit" as const } : {}),
    nextAttemptAt: new Date(options.nowMs + delay).toISOString(),
    ...(observation?.retryAfterSeconds !== undefined
      ? { retryAfterSeconds: observation.retryAfterSeconds }
      : {}),
    errors,
    updatedAt: options.occurredAt,
  };
  return waiting;
}
