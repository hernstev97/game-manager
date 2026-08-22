import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const listeners = new Map<string, unknown>();
const context = createContext({
  URL,
  Set,
  Promise,
  Error,
  Number,
  setTimeout,
  self: {
    location: { origin: "https://ggrid.test" },
    clients: { claim: () => Promise.resolve() },
    skipWaiting: () => Promise.resolve(),
    addEventListener: (name: string, listener: unknown) => listeners.set(name, listener),
  },
});
runInContext(source, context);

function classify(url: string, destination = "", mode = "cors"): string {
  return runInContext(
    `classifyRequest(${JSON.stringify(url)}, ${JSON.stringify(destination)}, ${JSON.stringify(mode)})`,
    context,
  ) as string;
}

describe("service worker cache policy", () => {
  it("uses Cache First only for static Next assets", () => {
    expect(classify("https://ggrid.test/_next/static/chunks/app.js", "script")).toBe("next-static");
    expect(classify("https://ggrid.test/_next/image?url=https%3A%2F%2Fexample.com", "image")).toBe(
      "network-only",
    );
  });

  it("keeps API and sensitive URLs network-only", () => {
    expect(classify("https://ggrid.test/api/steam?key=private")).toBe("network-only");
    expect(classify("https://api.igdb.com/v4/games", "")).toBe("network-only");
    expect(classify("https://ggrid.test/_next/static/app.js?authorization=private", "script")).toBe(
      "network-only",
    );
    expect(classify("https://ggrid.test/library?client_secret=private", "", "navigate")).toBe(
      "network-only",
    );
  });

  it("allows only query-free images from explicit image CDNs", () => {
    expect(classify("https://images.igdb.com/igdb/image/upload/t_cover_big/co1.png", "image")).toBe(
      "remote-image",
    );
    expect(classify("https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg", "image")).toBe(
      "remote-image",
    );
    expect(classify("https://example.com/cover.png", "image")).toBe("network-only");
    expect(classify("https://images.igdb.com/cover.png?token=secret", "image")).toBe("network-only");
  });

  it("registers install, activate, message, and fetch handlers", () => {
    expect([...listeners.keys()]).toEqual(["install", "activate", "message", "fetch"]);
  });
});
