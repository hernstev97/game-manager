export type SteamCoverKind = "header" | "library" | "capsule";

export function steamCover(appId: number, kind: SteamCoverKind = "header"): string {
  if (kind === "library") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
  }
  if (kind === "capsule") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`;
  }
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
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
};

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
  const payload = (await steamProxy(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`,
  )) as Record<string, { success?: boolean; data?: { name?: string; release_date?: { coming_soon?: boolean } } }>;
  const entry = payload[String(appId)];
  if (!entry?.success || !entry.data?.name) return null;
  return {
    appId,
    name: entry.data.name,
    coverUrl: steamCover(appId, "header"),
    released: entry.data.release_date?.coming_soon !== true,
  };
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
