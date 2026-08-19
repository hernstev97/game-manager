import { NextRequest } from "next/server";
import {
  igdbGameQuery,
  igdbSearchQuery,
  parseIgdbGamePayload,
  parseIgdbSearchHits,
  type IgdbRef,
} from "@/lib/igdb";

type TokenCache = {
  token: string;
  expiresAt: number;
  secret: string;
};

const tokens = new Map<string, TokenCache>();

function headerCreds(request: NextRequest): { clientId: string; clientSecret: string } {
  return {
    clientId: request.headers.get("x-twitch-client-id")?.trim() ?? "",
    clientSecret: request.headers.get("x-twitch-client-secret")?.trim() ?? "",
  };
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = 12000,
): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

async function twitchToken(clientId: string, clientSecret: string, force = false): Promise<string> {
  const cached = tokens.get(clientId);
  if (
    !force &&
    cached &&
    cached.secret === clientSecret &&
    cached.expiresAt > Date.now() + 60_000
  ) {
    return cached.token;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const { status, json } = await fetchJson("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const token =
    json && typeof json === "object" && typeof (json as { access_token?: unknown }).access_token === "string"
      ? (json as { access_token: string; expires_in?: number }).access_token
      : "";
  const expiresIn =
    json && typeof json === "object" && typeof (json as { expires_in?: unknown }).expires_in === "number"
      ? (json as { expires_in: number }).expires_in
      : 0;
  if (status >= 400 || !token) {
    tokens.delete(clientId);
    throw new Error("Twitch-Zugangsdaten wurden abgelehnt. Client-ID und Secret prüfen.");
  }
  tokens.set(clientId, {
    token,
    secret: clientSecret,
    expiresAt: Date.now() + Math.max(60, expiresIn) * 1000,
  });
  return token;
}

async function igdbPost(clientId: string, token: string, apicalypse: string) {
  return fetchJson("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
    },
    body: apicalypse,
  });
}

function parseGameRef(body: { id?: unknown; slug?: unknown }): IgdbRef | null {
  if (typeof body.id === "number" && Number.isInteger(body.id) && body.id > 0) {
    return { kind: "id", value: body.id };
  }
  if (typeof body.slug === "string") {
    const slug = body.slug.trim().toLowerCase();
    if (/^[a-z0-9][a-z0-9_-]*$/.test(slug)) return { kind: "slug", value: slug };
  }
  return null;
}

function igdbErrorMessage(status: number, json: unknown): string {
  if (status === 401 || status === 403) {
    return "IGDB hat die Zugangsdaten abgelehnt.";
  }
  if (status === 429) {
    return "IGDB-Rate-Limit erreicht. Kurz warten und erneut versuchen.";
  }
  const message =
    json && typeof json === "object" && typeof (json as { message?: unknown }).message === "string"
      ? (json as { message: string }).message
      : "";
  return message || `IGDB nicht erreichbar (${status}).`;
}

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const { clientId, clientSecret } = headerCreds(request);
  if (!clientId || !clientSecret) {
    return fail("Twitch-Client-ID und Client-Secret fehlen.", 400);
  }

  let body: { op?: unknown; query?: unknown; id?: unknown; slug?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("Ungültiger Request-Body.", 400);
  }

  const op = body.op;
  if (op !== "search" && op !== "game") {
    return fail("Unbekannte IGDB-Operation.", 400);
  }

  let query = "";
  let ref: IgdbRef | null = null;
  if (op === "search") {
    query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 2) return Response.json({ hits: [] });
  } else {
    ref = parseGameRef(body);
    if (!ref) return fail("IGDB-ID oder Slug fehlt.", 400);
  }

  try {
    let token = await twitchToken(clientId, clientSecret);
    const apicalypse = op === "search" ? igdbSearchQuery(query) : igdbGameQuery(ref!);
    let result = await igdbPost(clientId, token, apicalypse);
    if (result.status === 401 || result.status === 403) {
      token = await twitchToken(clientId, clientSecret, true);
      result = await igdbPost(clientId, token, apicalypse);
    }
    if (result.status >= 400) {
      const mapped = result.status >= 500 ? 502 : result.status;
      return fail(igdbErrorMessage(result.status, result.json), mapped);
    }
    if (op === "search") {
      return Response.json({ hits: parseIgdbSearchHits(result.json) });
    }
    return Response.json({ game: parseIgdbGamePayload(result.json) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IGDB nicht erreichbar.";
    const rejected = message.includes("abgelehnt");
    return fail(message, rejected ? 401 : 502);
  }
}
