export const PWA_SHARE_EVENT = "ggrid:pwa-share-target";

export type IgdbShareReference =
  | { kind: "id"; value: number }
  | { kind: "slug"; value: string };

export type PwaSharePayload = {
  source: "web-share-target";
  kind: "steam" | "igdb" | "url" | "name";
  query: string;
  name: string | null;
  url: string | null;
  steamAppId?: number;
  igdbRef?: IgdbShareReference;
  raw: {
    title: string;
    text: string;
    url: string;
  };
};

export type PwaShareHandler = (
  payload: PwaSharePayload,
) => boolean | void | Promise<boolean | void>;

export type PwaShareEventDetail = {
  payload: PwaSharePayload;
  accept: (work?: boolean | void | Promise<boolean | void>) => void;
};

const URL_PATTERN = /(?:https?:\/\/|steam:\/\/)[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[),.;!?\]}]+$/;

function clean(value: string | null): string {
  return value?.trim() ?? "";
}

function extractUrls(...values: string[]): string[] {
  const found: string[] = [];
  for (const value of values) {
    for (const match of value.match(URL_PATTERN) ?? []) {
      const candidate = match.replace(TRAILING_PUNCTUATION, "");
      if (candidate && !found.includes(candidate)) found.push(candidate);
    }
  }
  return found;
}

function parseSteamUrl(value: string): number | null {
  const match = value.match(
    /(?:store\.steampowered\.com\/app\/|steam:\/\/(?:store|rungameid|install|url\/StoreAppPage)\/)(\d{1,10})/i,
  );
  if (!match) return null;
  const appId = Number(match[1]);
  return Number.isSafeInteger(appId) && appId > 0 ? appId : null;
}

function parseIgdbUrl(value: string): IgdbShareReference | null {
  const match = value.match(/(?:www\.)?igdb\.com\/games\/([a-z0-9][a-z0-9_-]*)/i);
  if (!match) return null;
  const token = match[1];
  const id = Number(token);
  if (/^\d{1,10}$/.test(token) && Number.isSafeInteger(id) && id > 0) {
    return { kind: "id", value: id };
  }
  return { kind: "slug", value: token.toLowerCase() };
}

function validWebUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function sharedName(title: string, text: string, urls: string[]): string | null {
  const withoutUrls = text
    .replace(URL_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
  const candidate = title || withoutUrls;
  if (!candidate || urls.includes(candidate)) return null;
  return candidate.slice(0, 240);
}

export function parseShareTarget(params: URLSearchParams): PwaSharePayload | null {
  if (params.get("share-target") !== "1") return null;

  const title = clean(params.get("title"));
  const text = clean(params.get("text"));
  const explicitUrl = clean(params.get("url"));
  const urls = extractUrls(explicitUrl, text, title);
  const name = sharedName(title, text, urls);
  const raw = { title, text, url: explicitUrl };

  for (const url of urls) {
    const steamAppId = parseSteamUrl(url);
    if (steamAppId) {
      return { source: "web-share-target", kind: "steam", query: url, name, url, steamAppId, raw };
    }
  }

  for (const url of urls) {
    const igdbRef = parseIgdbUrl(url);
    if (igdbRef) {
      return { source: "web-share-target", kind: "igdb", query: url, name, url, igdbRef, raw };
    }
  }

  for (const candidate of urls) {
    const url = validWebUrl(candidate);
    if (url) {
      return { source: "web-share-target", kind: "url", query: url, name, url, raw };
    }
  }

  const query = name ?? text.slice(0, 240);
  if (!query) return null;
  return { source: "web-share-target", kind: "name", query, name: query, url: null, raw };
}

export function shareFingerprint(payload: PwaSharePayload): string {
  return JSON.stringify([payload.kind, payload.query, payload.raw]);
}

export function removeShareTargetParams(url: URL): string {
  const next = new URL(url.href);
  for (const key of ["share-target", "title", "text", "url"]) next.searchParams.delete(key);
  return `${next.pathname}${next.search}${next.hash}`;
}

export async function dispatchPwaShareTarget(payload: PwaSharePayload): Promise<boolean | null> {
  let accepted: Promise<boolean | void> | null = null;
  const detail: PwaShareEventDetail = {
    payload,
    accept(work) {
      accepted = Promise.resolve(work);
    },
  };
  window.dispatchEvent(new CustomEvent<PwaShareEventDetail>(PWA_SHARE_EVENT, { detail }));
  if (!accepted) return null;
  return (await accepted) !== false;
}
