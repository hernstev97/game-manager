import { describe, expect, it } from "vitest";
import {
  isSteamPriceSnapshot,
  parseSteamAppDetailsPayload,
  parseSteamIdentity,
  parseSteamPrice,
  steamPriceLabel,
  steamPriceSortValue,
  steamStoreUrl,
} from "./steam";

describe("parseSteamIdentity", () => {
  it("accepts a 64-bit id", () => {
    expect(parseSteamIdentity("76561197960434622")).toEqual({
      kind: "steam64",
      value: "76561197960434622",
    });
  });

  it("accepts vanity names and profile URLs", () => {
    expect(parseSteamIdentity("robinwalker")).toEqual({ kind: "vanity", value: "robinwalker" });
    expect(parseSteamIdentity("https://steamcommunity.com/id/robinwalker")).toEqual({
      kind: "vanity",
      value: "robinwalker",
    });
    expect(parseSteamIdentity("https://steamcommunity.com/profiles/76561197960434622")).toEqual({
      kind: "steam64",
      value: "76561197960434622",
    });
  });

  it("rejects empty or junk input", () => {
    expect(parseSteamIdentity("")).toBeNull();
    expect(parseSteamIdentity("???")).toBeNull();
  });
});

describe("steam store and price", () => {
  const now = new Date("2026-08-19T12:00:00.000Z");

  it("builds a store URL from the app id", () => {
    expect(steamStoreUrl(1245620)).toBe("https://store.steampowered.com/app/1245620");
  });

  it("marks free games as kostenlos", () => {
    const price = parseSteamPrice({ is_free: true }, now);
    expect(price).toMatchObject({
      source: "steam",
      isFree: true,
      finalCents: 0,
      formatted: "Kostenlos",
      updatedAt: now.toISOString(),
    });
    expect(steamPriceLabel(price)).toBe("Kostenlos");
    expect(steamPriceSortValue(price)).toBe(0);
  });

  it("reads a discounted EUR store price", () => {
    const price = parseSteamPrice(
      {
        is_free: false,
        price_overview: {
          currency: "EUR",
          initial: 5999,
          final: 2999,
          discount_percent: 50,
        },
      },
      now,
    );
    expect(price?.currency).toBe("EUR");
    expect(price?.initialCents).toBe(5999);
    expect(price?.finalCents).toBe(2999);
    expect(price?.discountPercent).toBe(50);
    expect(price?.formatted).toMatch(/29,99/);
    expect(steamPriceLabel(price)).toMatch(/29,99/);
    expect(steamPriceLabel(price)).toContain("−50%");
    expect(steamPriceSortValue(price)).toBe(2999);
  });

  it("returns null when Steam has no price", () => {
    expect(parseSteamPrice({ is_free: false }, now)).toBeNull();
    expect(steamPriceSortValue(null)).toBeNull();
  });

  it("parses appdetails payloads including price", () => {
    const details = parseSteamAppDetailsPayload(
      10,
      {
        "10": {
          success: true,
          data: {
            name: "Counter-Strike",
            is_free: false,
            release_date: { coming_soon: false },
            price_overview: {
              currency: "EUR",
              initial: 819,
              final: 819,
              discount_percent: 0,
            },
          },
        },
      },
      now,
    );
    expect(details?.name).toBe("Counter-Strike");
    expect(details?.price?.finalCents).toBe(819);
    expect(parseSteamAppDetailsPayload(10, { "10": { success: false } })).toBeNull();
  });

  it("rejects malformed price snapshots", () => {
    const valid = parseSteamPrice(
      {
        is_free: false,
        price_overview: { currency: "EUR", initial: 5999, final: 2999, discount_percent: 50 },
      },
      now,
    );
    expect(isSteamPriceSnapshot(valid)).toBe(true);
    expect(isSteamPriceSnapshot({ ...valid, source: "itad" })).toBe(false);
    expect(isSteamPriceSnapshot({ ...valid, finalCents: -1 })).toBe(false);
    expect(isSteamPriceSnapshot({ ...valid, discountPercent: 12.5 })).toBe(false);
  });
});
