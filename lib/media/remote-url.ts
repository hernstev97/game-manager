export function normalizeRemoteImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}
export function isRemoteImageUrl(value: string): boolean {
  return normalizeRemoteImageUrl(value) !== null;
}
