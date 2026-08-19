export type SteamCoverKind = "header" | "library" | "capsule";

/** Storefront region for prices. Not a user setting yet. */
export const STEAM_STORE_COUNTRY = "DE";

export type SteamPriceSnapshot = {
  source: "steam";
  currency: string;
  initialCents: number | null;
  finalCents: number | null;
  discountPercent: number;
  isFree: boolean;
  formatted: string;
  updatedAt: string;
};

type SteamPriceOverviewRaw = {
  currency?: string;
  initial?: number;
  final?: number;
  discount_percent?: number;
  initial_formatted?: string;
  final_formatted?: string;
};

type SteamAppDetailsData = {
  name?: string;
  is_free?: boolean;
  release_date?: { coming_soon?: boolean };
  price_overview?: SteamPriceOverviewRaw;
};

export function steamCover(appId: number, kind: SteamCoverKind = "header"): string {
  if (kind === "library") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
  }
  if (kind === "capsule") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`;
  }
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

export function steamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`;
}

export function isSteamPriceSnapshot(value: unknown): value is SteamPriceSnapshot {
  if (!value || typeof value !== "object") return false;
  const price = value as SteamPriceSnapshot;
  return (
    price.source === "steam" &&
    typeof price.currency === "string" &&
    typeof price.isFree === "boolean" &&
    typeof price.formatted === "string" &&
    typeof price.updatedAt === "string" &&
    typeof price.discountPercent === "number"
  );
}

export function steamPriceSortValue(price: SteamPriceSnapshot | null | undefined): number | null {
  if (!price) return null;
  if (price.isFree) return 0;
  return typeof price.finalCents === "number" ? price.finalCents : null;
}

export function steamPriceLabel(price: SteamPriceSnapshot | null | undefined): string {
  if (!price) return "";
  if (price.isFree) return "Kostenlos";
  if (
    price.discountPercent > 0 &&
    price.initialCents != null &&
    price.finalCents != null &&
    price.initialCents > price.finalCents
  ) {
    return `${price.formatted} (−${price.discountPercent}%)`;
  }
  return price.formatted;
}

export function formatMoneyFromCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function toCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

export function parseSteamPrice(
  data: SteamAppDetailsData | null | undefined,
  now = new Date(),
): SteamPriceSnapshot | null {
  if (!data) return null;
  const updatedAt = now.toISOString();
  if (data.is_free) {
    return {
      source: "steam",
      currency: data.price_overview?.currency || "EUR",
      initialCents: 0,
      finalCents: 0,
      discountPercent: 0,
      isFree: true,
      formatted: "Kostenlos",
      updatedAt,
    };
  }

  const overview = data.price_overview;
  if (!overview) return null;

  const currency = overview.currency?.trim() || "EUR";
  const finalCents = toCents(overview.final);
  const initialCents = toCents(overview.initial) ?? finalCents;
  const statedDiscount =
    typeof overview.discount_percent === "number" && Number.isFinite(overview.discount_percent)
      ? Math.max(0, Math.round(overview.discount_percent))
      : null;
  const computedDiscount =
    initialCents != null && finalCents != null && initialCents > finalCents
      ? Math.round((1 - finalCents / initialCents) * 100)
      : 0;
  const discountPercent = statedDiscount ?? computedDiscount;

  if (finalCents == null) {
    const formatted = overview.final_formatted?.trim();
    if (!formatted) return null;
    return {
      source: "steam",
      currency,
      initialCents,
      finalCents: null,
      discountPercent,
      isFree: false,
      formatted,
      updatedAt,
    };
  }

  return {
    source: "steam",
    currency,
    initialCents,
    finalCents,
    discountPercent,
    isFree: false,
    formatted: formatMoneyFromCents(finalCents, currency),
    updatedAt,
  };
}

export function parseSteamInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{1,10}$/.test(trimmed)) {
    const id = Number(trimmed);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
  const store = trimmed.match(/store\.steampowered\.com\/app\/(\d+)/i);
  if (store) return Number(store[1]);
  const steam = trimmed.match(/steam:\/\/(?:store|rungameid|install|url\/StoreAppPage)\/(\d+)/i);
  if (steam) return Number(steam[1]);
  return null;
}

export function redactSteamUrl(url: string): string {
  return url.replace(/([?&]key=)[^&]+/gi, "$1***");
}

export type SteamAppDetails = {
  appId: number;
  name: string;
  coverUrl: string;
  released: boolean;
  price: SteamPriceSnapshot | null;
};

export function parseSteamAppDetailsPayload(
  appId: number,
  payload: unknown,
  now = new Date(),
): SteamAppDetails | null {
  if (!payload || typeof payload !== "object") return null;
  const entry = (payload as Record<string, { success?: boolean; data?: SteamAppDetailsData }>)[
    String(appId)
  ];
  if (!entry?.success || !entry.data?.name) return null;
  return {
    appId,
    name: entry.data.name,
    coverUrl: steamCover(appId, "header"),
    released: entry.data.release_date?.coming_soon !== true,
    price: parseSteamPrice(entry.data, now),
  };
}

export type SteamOwnedGame = {
  appId: number;
  name: string;
  playtimeMinutes: number;
};

export type SteamSearchHit = {
  appId: number;
  name: string;
  coverUrl: string;
};

async function steamProxy(targetUrl: string): Promise<unknown> {
  const response = await fetch(`/api/steam?url=${encodeURIComponent(targetUrl)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Steam-Anfrage fehlgeschlagen (${response.status})`);
  }
  return response.json();
}

export async function fetchSteamAppDetails(appId: number): Promise<SteamAppDetails | null> {
  return parseSteamAppDetailsPayload(
    appId,
    await steamProxy(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${STEAM_STORE_COUNTRY}&l=english`,
    ),
  );
}

export async function searchSteamStore(term: string): Promise<SteamSearchHit[]> {
  const query = term.trim();
  if (query.length < 2) return [];
  const payload = (await steamProxy(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
  )) as { items?: Array<{ id?: number; name?: string; tiny_image?: string }> };
  return (payload.items ?? [])
    .filter((item): item is { id: number; name: string; tiny_image?: string } =>
      typeof item.id === "number" && typeof item.name === "string",
    )
    .slice(0, 8)
    .map((item) => ({
      appId: item.id,
      name: item.name,
      coverUrl: steamCover(item.id, "header"),
    }));
}

export type SteamIdentity = {
  kind: "steam64" | "vanity";
  value: string;
};

/** Accepts Steam64, custom URL name, or a community profile URL. */
export function parseSteamIdentity(input: string): SteamIdentity | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const profile = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profile) return { kind: "steam64", value: profile[1] };

  const vanityUrl = trimmed.match(/steamcommunity\.com\/(?:id|user)\/([^/?#]+)/i);
  if (vanityUrl) return { kind: "vanity", value: decodeURIComponent(vanityUrl[1]) };

  if (/^\d{17}$/.test(trimmed)) return { kind: "steam64", value: trimmed };

  if (/^[a-zA-Z0-9_-]{2,64}$/.test(trimmed)) return { kind: "vanity", value: trimmed };

  return null;
}

export type OwnedGamesResult = {
  steamId: string;
  games: SteamOwnedGame[];
};

export async function fetchOwnedSteamGames(
  steamId: string,
  apiKey: string,
): Promise<OwnedGamesResult> {
  const id = steamId.trim();
  const key = apiKey.trim();
  if (!id || !key) {
    throw new Error("Steam-ID und Web-API-Schlüssel fehlen.");
  }
  if (!parseSteamIdentity(id)) {
    throw new Error("Ungültige Steam-ID. 64-bit-Nummer, Custom-URL oder Profil-Link.");
  }

  const response = await fetch(`/api/steam/owned?id=${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Steam-Key": key,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; steamId?: string; games?: SteamOwnedGame[] }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error || `Steam-Anfrage fehlgeschlagen (${response.status})`);
  }
  return {
    steamId: payload?.steamId || id,
    games: Array.isArray(payload?.games) ? payload.games : [],
  };
}
