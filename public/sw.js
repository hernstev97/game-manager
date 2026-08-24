const CACHE_VERSION = "v2";
const SHELL_CACHE = `ggrid-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `ggrid-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `ggrid-images-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE]);
const APP_SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/ggrid-192.png",
  "/icons/ggrid-512.png",
];
const APP_SHELL_PATHS = new Set(APP_SHELL);
const IMAGE_HOSTS = new Set([
  "cdn.cloudflare.steamstatic.com",
  "shared.cloudflare.steamstatic.com",
  "shared.fastly.steamstatic.com",
  "images.igdb.com",
]);
const BLOCKED_HOSTS = new Set([
  "api.steampowered.com",
  "store.steampowered.com",
  "api.igdb.com",
  "www.igdb.com",
]);
const SENSITIVE_KEY = /(?:^|[-_])(auth(?:orization)?|credential|token|secret|password|session|signature|sig|key|code|api[-_]?key|client[-_]?secret)(?:$|[-_])/i;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_ENTRIES = 48;
const NAVIGATION_TIMEOUT_MS = 5000;

function hasSensitiveData(url) {
  if (url.username || url.password) return true;
  if (/^\/(?:api|auth)(?:\/|$)/i.test(url.pathname)) return true;
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_KEY.test(key)) return true;
  }
  return false;
}

function classifyRequest(rawUrl, destination = "", mode = "cors") {
  const url = new URL(rawUrl, self.location.origin);
  if (hasSensitiveData(url) || BLOCKED_HOSTS.has(url.hostname)) return "network-only";
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    return "next-static";
  }
  if (
    url.origin === self.location.origin
    && mode !== "navigate"
    && url.search === ""
    && APP_SHELL_PATHS.has(url.pathname)
  ) {
    return "shell-static";
  }
  if (url.origin === self.location.origin && mode === "navigate") return "navigation";
  if (destination === "image" && IMAGE_HOSTS.has(url.hostname) && url.search === "") {
    return "remote-image";
  }
  return "network-only";
}

function timeoutAfter(milliseconds) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("network timeout")), milliseconds);
  });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== "opaque") await cache.put(request, response.clone());
  return response;
}

async function navigationNetworkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const url = new URL(request.url);
  try {
    const response = await Promise.race([fetch(request), timeoutAfter(NAVIGATION_TIMEOUT_MS)]);
    if (response.ok && url.search === "" && !hasSensitiveData(url)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("/")) ?? cache.match("/offline.html");
  }
}

async function responseFitsImagePolicy(response) {
  if (!response.ok || response.type === "opaque") return false;
  const responseUrl = new URL(response.url);
  if (!IMAGE_HOSTS.has(responseUrl.hostname) || hasSensitiveData(responseUrl)) return false;
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) return false;
  const bytes = await response.clone().blob();
  return bytes.size > 0 && bytes.size <= MAX_IMAGE_BYTES;
}

async function trimImageCache(cache) {
  const keys = await cache.keys();
  const overflow = keys.length - MAX_IMAGE_ENTRIES;
  if (overflow > 0) await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function remoteImageCacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (await responseFitsImagePolicy(response)) {
    await cache.put(request, response.clone());
    await trimImageCache(cache);
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("ggrid-") && !CURRENT_CACHES.has(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => caches.open(IMAGE_CACHE))
      .then(trimImageCache)
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const policy = classifyRequest(event.request.url, event.request.destination, event.request.mode);
  if (policy === "next-static") {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  } else if (policy === "shell-static") {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
  } else if (policy === "navigation") {
    event.respondWith(navigationNetworkFirst(event.request));
  } else if (policy === "remote-image") {
    event.respondWith(remoteImageCacheFirst(event.request));
  }
});
