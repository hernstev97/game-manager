import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set(["store.steampowered.com", "api.steampowered.com"]);

function redact(url: string): string {
  return url.replace(/([?&]key=)[^&]+/gi, "$1***");
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return Response.json({ error: "url fehlt" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ error: "Ungültige URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return Response.json({ error: "Host nicht erlaubt" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(parsed, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "GameLibrary/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: `Steam nicht erreichbar (${redact(target)})` }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
