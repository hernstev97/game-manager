export function parseRetryAfter(
  value: string | null | undefined,
  nowMs = Date.now(),
): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (/^\d+$/.test(trimmed)) {
    const delayMs = Number(trimmed) * 1_000;
    return Number.isFinite(delayMs) ? delayMs : undefined;
  }

  const retryAt = Date.parse(trimmed);
  if (!Number.isFinite(retryAt)) return undefined;
  return Math.max(0, retryAt - nowMs);
}
