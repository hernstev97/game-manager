import { PLATFORMS } from "./game-fields";

export type IgdbCredentials = {
  clientId: string;
  clientSecret: string;
};

export type IgdbRef = { kind: "id"; value: number } | { kind: "slug"; value: string };

export type IgdbSearchHit = {
  id: number;
  name: string;
  coverUrl: string;
  platforms: string[];
  year: number | null;
};

export type IgdbGameDetails = {
  id: number;
  name: string;
  slug: string;
  url: string;
  coverUrl: string;
  genres: string[];
  franchise: string;
  platforms: string[];
  released: boolean;
  steamAppId: number | null;
  year: number | null;
};

/** DLC, expansions, mods, episodes — not useful as library entries. */
const SKIP_GAME_TYPES = new Set([1, 2, 5, 6, 7, 13, 14]);

/** Steam's historical external_games category / source id. */
const STEAM_EXTERNAL_SOURCE = 1;

/**
 * IGDB platform id → gGrid label. Unlisted ids are dropped.
 * Switch 2 is 508 (IGDB platform list).
 */
export const IGDB_PLATFORM_LABELS: Record<number, string> = {
  3: "PC",
  4: "N64",
  5: "Wii",
  6: "PC",
  7: "PS1",
  8: "PS2",
  9: "PS3",
  11: "Xbox",
  12: "Xbox",
  13: "PC",
  14: "PC",
  20: "DS",
  21: "GameCube",
  22: "Game Boy Color",
  24: "GBA",
  33: "Game Boy",
  37: "3DS",
  38: "PSP",
  41: "Wii U",
  46: "PS Vita",
  48: "PS4",
  49: "Xbox",
  56: "Wii",
  92: "PC",
  130: "Switch",
  137: "3DS",
  159: "DS",
  167: "PS5",
  169: "Xbox",
  390: "PS5",
  508: "Switch 2",
};

export function hasIgdbCredentials(
  creds: { clientId?: string; clientSecret?: string } | null | undefined,
): boolean {
  return Boolean(creds?.clientId?.trim() && creds?.clientSecret?.trim());
}

export function escapeApicalypseString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function igdbCoverUrl(imageId: string, size = "cover_big"): string {
  const id = imageId.trim();
  if (!id) return "";
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.png`;
}

export function igdbGameUrl(slug: string): string {
  return `https://www.igdb.com/games/${slug}`;
}

export function igdbSearchUrl(query: string): string {
  return `https://www.igdb.com/search?q=${encodeURIComponent(query)}`;
}

export function parseIgdbInput(input: string): IgdbRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const prefixedId = trimmed.match(/^igdb:(\d{1,10})$/i);
  if (prefixedId) {
    const id = Number(prefixedId[1]);
    return Number.isInteger(id) && id > 0 ? { kind: "id", value: id } : null;
  }

  const prefixedSlug = trimmed.match(/^igdb:([a-z0-9][a-z0-9_-]*)$/i);
  if (prefixedSlug) return { kind: "slug", value: prefixedSlug[1].toLowerCase() };

  const page = trimmed.match(/igdb\.com\/games\/([a-z0-9][a-z0-9_-]*)/i);
  if (page) {
    const token = page[1];
    if (/^\d{1,10}$/.test(token)) {
      const id = Number(token);
      return Number.isInteger(id) && id > 0 ? { kind: "id", value: id } : null;
    }
    return { kind: "slug", value: token.toLowerCase() };
  }

  return null;
}

export function mapIgdbPlatforms(platformIds: readonly number[]): string[] {
  const found = new Set<string>();
  for (const id of platformIds) {
    const label = IGDB_PLATFORM_LABELS[id];
    if (label) found.add(label);
  }
  const ordered: string[] = [];
  for (const label of PLATFORMS) {
    if (found.has(label)) {
      ordered.push(label);
      found.delete(label);
    }
  }
  const extras = [...found].sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
  return [...ordered, ...extras];
}

export function supportingTextForHit(hit: IgdbSearchHit): string {
  const parts: string[] = [];
  if (hit.year) parts.push(String(hit.year));
  if (hit.platforms.length) parts.push(hit.platforms.slice(0, 3).join(", "));
  return parts.join(" · ") || "IGDB";
}

export function catalogFieldsFromIgdb(details: IgdbGameDetails): {
  igdbId: number;
  name: string;
  coverUrl: string;
  genres: string[];
  franchise: string;
  platforms: string[];
  released: boolean;
  steamAppId?: number;
} {
  return {
    igdbId: details.id,
    name: details.name,
    coverUrl: details.coverUrl,
    genres: details.genres.slice(0, 2),
    franchise: details.franchise,
    platforms: details.platforms,
    released: details.released,
    ...(details.steamAppId != null ? { steamAppId: details.steamAppId } : {}),
  };
}

export function mergeCatalogFields(
  current: {
    name: string;
    coverUrl: string;
    genres: string[];
    franchise: string;
    platforms: string[];
    steamAppId: number | null;
  },
  details: IgdbGameDetails,
): ReturnType<typeof catalogFieldsFromIgdb> & { steamAppId?: number } {
  const next = catalogFieldsFromIgdb(details);
  return {
    ...next,
    name: next.name || current.name,
    coverUrl: next.coverUrl || current.coverUrl,
    genres: next.genres.length ? next.genres : current.genres,
    franchise: next.franchise || current.franchise,
    platforms: next.platforms.length ? next.platforms : current.platforms,
    ...(details.steamAppId != null
      ? { steamAppId: details.steamAppId }
      : current.steamAppId != null
        ? { steamAppId: current.steamAppId }
        : {}),
  };
}

type Named = { name?: string };
type CoverRaw = { image_id?: string };
type ExternalRaw = {
  uid?: string;
  url?: string;
  category?: unknown;
  external_game_source?: unknown;
};

export type IgdbGameRaw = {
  id?: number;
  name?: string;
  slug?: string;
  url?: string;
  cover?: CoverRaw | number;
  first_release_date?: number;
  genres?: Array<Named | number>;
  franchises?: Array<Named | number>;
  collections?: Array<Named | number>;
  platforms?: Array<number | { id?: number }>;
  game_status?: unknown;
  status?: unknown;
  game_type?: unknown;
  category?: unknown;
  external_games?: ExternalRaw[];
};

function unwrapId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (value && typeof value === "object" && typeof (value as { id?: unknown }).id === "number") {
    const id = (value as { id: number }).id;
    return Number.isInteger(id) ? id : null;
  }
  return null;
}

function namedValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const name =
      typeof item === "string"
        ? item.trim()
        : item && typeof item === "object" && typeof (item as Named).name === "string"
          ? (item as Named).name!.trim()
          : "";
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

function platformIdsFrom(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids: number[] = [];
  for (const item of value) {
    const id = unwrapId(item);
    if (id != null) ids.push(id);
  }
  return ids;
}

function coverUrlFrom(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const imageId = (value as CoverRaw).image_id;
  return typeof imageId === "string" ? igdbCoverUrl(imageId) : "";
}

function yearFromUnix(timestamp: unknown): number | null {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return null;
  const year = new Date(timestamp * 1000).getUTCFullYear();
  return year >= 1970 && year <= 2100 ? year : null;
}

function isReleased(raw: IgdbGameRaw, now: Date): boolean {
  const status = unwrapId(raw.game_status ?? raw.status);
  if (status === 6 || status === 7) return false;
  if (typeof raw.first_release_date === "number") {
    return raw.first_release_date * 1000 <= now.getTime();
  }
  return true;
}

function shouldSkipGameType(raw: IgdbGameRaw): boolean {
  const type = unwrapId(raw.game_type ?? raw.category);
  return type != null && SKIP_GAME_TYPES.has(type);
}

export function steamAppIdFromExternals(entries: unknown): number | null {
  if (!Array.isArray(entries)) return null;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as ExternalRaw;
    const source = unwrapId(row.category) ?? unwrapId(row.external_game_source);
    if (source === STEAM_EXTERNAL_SOURCE && typeof row.uid === "string" && /^\d{1,10}$/.test(row.uid)) {
      const id = Number(row.uid);
      if (id > 0) return id;
    }
    if (typeof row.url === "string") {
      const match = row.url.match(/store\.steampowered\.com\/app\/(\d+)/i);
      if (match) return Number(match[1]);
    }
  }
  return null;
}

function parseOneGame(raw: IgdbGameRaw, now: Date): IgdbGameDetails | null {
  if (typeof raw.id !== "number" || !Number.isInteger(raw.id) || raw.id <= 0) return null;
  if (typeof raw.name !== "string" || !raw.name.trim()) return null;
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const collections = namedValues(raw.collections);
  const franchises = namedValues(raw.franchises);
  return {
    id: raw.id,
    name: raw.name.trim(),
    slug,
    url: typeof raw.url === "string" && raw.url.trim() ? raw.url.trim() : slug ? igdbGameUrl(slug) : "",
    coverUrl: coverUrlFrom(raw.cover),
    genres: namedValues(raw.genres),
    franchise: collections[0] || franchises[0] || "",
    platforms: mapIgdbPlatforms(platformIdsFrom(raw.platforms)),
    released: isReleased(raw, now),
    steamAppId: steamAppIdFromExternals(raw.external_games),
    year: yearFromUnix(raw.first_release_date),
  };
}

export function parseIgdbGamePayload(payload: unknown, now = new Date()): IgdbGameDetails | null {
  const rows = Array.isArray(payload) ? payload : payload && typeof payload === "object" ? [payload] : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const parsed = parseOneGame(row as IgdbGameRaw, now);
    if (parsed) return parsed;
  }
  return null;
}

export function parseIgdbSearchHits(payload: unknown, now = new Date()): IgdbSearchHit[] {
  if (!Array.isArray(payload)) return [];
  const hits: IgdbSearchHit[] = [];
  const seen = new Set<number>();
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const raw = row as IgdbGameRaw;
    if (shouldSkipGameType(raw)) continue;
    const parsed = parseOneGame(raw, now);
    if (!parsed || seen.has(parsed.id)) continue;
    seen.add(parsed.id);
    hits.push({
      id: parsed.id,
      name: parsed.name,
      coverUrl: parsed.coverUrl,
      platforms: parsed.platforms,
      year: parsed.year,
    });
    if (hits.length >= 8) break;
  }
  return hits;
}

async function igdbProxy(creds: IgdbCredentials, body: unknown): Promise<unknown> {
  const clientId = creds.clientId.trim();
  const clientSecret = creds.clientSecret.trim();
  if (!clientId || !clientSecret) {
    throw new Error("IGDB ist nicht eingerichtet. Twitch-Client-ID und Secret in den Einstellungen.");
  }
  const response = await fetch("/api/igdb", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Twitch-Client-Id": clientId,
      "X-Twitch-Client-Secret": clientSecret,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; hits?: IgdbSearchHit[]; game?: IgdbGameDetails | null }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error || `IGDB-Anfrage fehlgeschlagen (${response.status})`);
  }
  return payload;
}

export async function searchIgdbGames(
  query: string,
  creds: IgdbCredentials,
): Promise<IgdbSearchHit[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const payload = (await igdbProxy(creds, { op: "search", query: term })) as {
    hits?: IgdbSearchHit[];
  };
  return Array.isArray(payload.hits) ? payload.hits : [];
}

export async function fetchIgdbGame(
  ref: IgdbRef,
  creds: IgdbCredentials,
): Promise<IgdbGameDetails | null> {
  const payload = (await igdbProxy(
    creds,
    ref.kind === "id" ? { op: "game", id: ref.value } : { op: "game", slug: ref.value },
  )) as { game?: IgdbGameDetails | null };
  return payload.game ?? null;
}

export const IGDB_SEARCH_FIELDS =
  "name,slug,cover.image_id,first_release_date,platforms,game_type,category";

export const IGDB_GAME_FIELDS =
  "name,slug,url,cover.image_id,first_release_date,genres.name,franchises.name,collections.name,platforms,game_status,status,game_type,category,external_games.uid,external_games.url,external_games.category,external_games.external_game_source";

export function igdbSearchQuery(term: string): string {
  return `search "${escapeApicalypseString(term)}"; fields ${IGDB_SEARCH_FIELDS}; where version_parent = null; limit 12;`;
}

export function igdbGameQuery(ref: IgdbRef): string {
  const where =
    ref.kind === "id"
      ? `where id = ${ref.value};`
      : `where slug = "${escapeApicalypseString(ref.value)}";`;
  return `fields ${IGDB_GAME_FIELDS}; ${where}`;
}
