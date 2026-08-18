import { NextRequest } from "next/server";
import { parseSteamIdentity } from "@/lib/steam";

type SteamOwnedRaw = {
  response?: {
    game_count?: number;
    games?: Array<{ appid?: number; name?: string; playtime_forever?: number }>;
  };
};

type VanityRaw = {
  response?: {
    success?: number;
    steamid?: string;
    message?: string;
  };
};

async function steamGet(url: URL): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    const json = await response.json().catch(() => null);
    return { status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveSteam64(identity: ReturnType<typeof parseSteamIdentity>, key: string) {
  if (!identity) return null;
  if (identity.kind === "steam64") return identity.value;

  const vanity = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
  vanity.searchParams.set("key", key);
  vanity.searchParams.set("vanityurl", identity.value);
  vanity.searchParams.set("url_type", "1");

  const { status, json } = await steamGet(vanity);
  const body = json as VanityRaw | null;
  if (status === 403) {
    throw new Error("Steam-API-Schlüssel wurde abgelehnt.");
  }
  if (status >= 400) {
    throw new Error("Steam-Profilname konnte nicht aufgelöst werden.");
  }
  if (body?.response?.success === 1 && body.response.steamid) {
    return body.response.steamid;
  }
  throw new Error("Kein Steam-Profil zu dieser Custom-URL gefunden.");
}

export async function GET(request: NextRequest) {
  const rawId = request.nextUrl.searchParams.get("id") ?? "";
  const key = request.headers.get("x-steam-key")?.trim() ?? "";
  const identity = parseSteamIdentity(rawId);

  if (!identity) {
    return Response.json(
      { error: "Ungültige Steam-ID. 64-bit-Nummer, Custom-URL oder Profil-Link." },
      { status: 400 },
    );
  }
  if (!key) {
    return Response.json({ error: "Web-API-Schlüssel fehlt." }, { status: 400 });
  }

  try {
    const steamId = await resolveSteam64(identity, key);
    if (!steamId) {
      return Response.json({ error: "Steam-ID fehlt." }, { status: 400 });
    }

    const owned = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");
    owned.searchParams.set("key", key);
    owned.searchParams.set("steamid", steamId);
    owned.searchParams.set("include_appinfo", "true");
    owned.searchParams.set("include_played_free_games", "true");
    owned.searchParams.set("format", "json");

    const { status, json } = await steamGet(owned);
    if (status === 403) {
      return Response.json({ error: "Steam-API-Schlüssel wurde abgelehnt." }, { status: 403 });
    }
    if (status === 401) {
      return Response.json({ error: "Steam-API-Schlüssel ungültig." }, { status: 401 });
    }
    if (status >= 400) {
      return Response.json(
        { error: "Steam hat die Spielzeit-Anfrage abgelehnt. Profil öffentlich?" },
        { status: 502 },
      );
    }

    const body = json as SteamOwnedRaw | null;
    const games = (body?.response?.games ?? [])
      .filter((game): game is { appid: number; name?: string; playtime_forever?: number } =>
        typeof game.appid === "number",
      )
      .map((game) => ({
        appId: game.appid,
        name: game.name ?? "",
        playtimeMinutes: game.playtime_forever ?? 0,
      }));

    return Response.json({ steamId, games });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Steam nicht erreichbar.";
    return Response.json({ error: message }, { status: 502 });
  }
}
