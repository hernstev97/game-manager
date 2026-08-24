import type { RetryPolicy } from "../rate-limit";

export function calculateBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random,
): number {
  const exponent = Math.max(0, Math.floor(attempt) - 1);
  const base = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
  const boundedRandom = Math.max(0, Math.min(1, random()));
  const jitterFactor = 1 + (boundedRandom * 2 - 1) * policy.jitterRatio;
  return Math.max(0, Math.min(policy.maxDelayMs, Math.round(base * jitterFactor)));
}
