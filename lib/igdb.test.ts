import { describe, expect, it } from "vitest";
import {
  catalogFieldsFromIgdb,
  escapeApicalypseString,
  hasIgdbCredentials,
  igdbCoverUrl,
  igdbGameQuery,
  igdbGameUrl,
  igdbSearchQuery,
  mapIgdbPlatforms,
  mergeCatalogFields,
  parseIgdbGamePayload,
  parseIgdbInput,
  parseIgdbSearchHits,
  steamAppIdFromExternals,
  supportingTextForHit,
} from "./igdb";

const now = new Date("2026-08-19T12:00:00.000Z");

describe("parseIgdbInput", () => {
  it("reads igdb.com game URLs and igdb: prefixes", () => {
    expect(parseIgdbInput("https://www.igdb.com/games/the-legend-of-zelda-the-wind-waker")).toEqual({
      kind: "slug",
      value: "the-legend-of-zelda-the-wind-waker",
    });
    expect(parseIgdbInput("igdb:1020")).toEqual({ kind: "id", value: 1020 });
    expect(parseIgdbInput("igdb:wind-waker")).toEqual({ kind: "slug", value: "wind-waker" });
  });

  it("does not treat a bare name or Steam URL as IGDB", () => {
    expect(parseIgdbInput("Wind Waker")).toBeNull();
    expect(parseIgdbInput("https://store.steampowered.com/app/123")).toBeNull();
    expect(parseIgdbInput("1245620")).toBeNull();
    expect(parseIgdbInput("")).toBeNull();
  });
});

describe("platform and cover mapping", () => {
  it("orders known platforms by the library list and appends extras", () => {
    expect(mapIgdbPlatforms([167, 6, 21, 508, 8, 46])).toEqual([
      "PC",
      "Switch 2",
      "GameCube",
      "PS5",
      "PS2",
      "PS Vita",
    ]);
  });

  it("maps Xbox family and PC variants onto the collapsed labels", () => {
    expect(mapIgdbPlatforms([11, 12, 49, 169, 3, 14, 92])).toEqual(["PC", "Xbox"]);
  });

  it("drops unmapped platforms", () => {
    expect(mapIgdbPlatforms([52, 23])).toEqual([]);
  });

  it("builds a cover URL from an image id", () => {
    expect(igdbCoverUrl("abc123")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.png",
    );
    expect(igdbGameUrl("the-wind-waker")).toBe("https://www.igdb.com/games/the-wind-waker");
  });
});

describe("parse IGDB payloads", () => {
  it("reads catalog fields, collection as franchise, and a Steam external id", () => {
    const details = parseIgdbGamePayload(
      [
        {
          id: 1026,
          name: "The Legend of Zelda: The Wind Waker",
          slug: "the-legend-of-zelda-the-wind-waker",
          url: "https://www.igdb.com/games/the-legend-of-zelda-the-wind-waker",
          cover: { image_id: "co2abc" },
          first_release_date: 1047600000,
          genres: [{ name: "Adventure" }, { name: "Role-playing (RPG)" }, { name: "Puzzle" }],
          collections: [{ name: "The Legend of Zelda" }],
          franchises: [{ name: "Zelda" }],
          platforms: [21, 41],
          game_status: 0,
          game_type: 0,
          external_games: [
            { category: 5, uid: "gog-id" },
            { category: 1, uid: "10140", url: "https://store.steampowered.com/app/10140" },
          ],
        },
      ],
      now,
    );
    expect(details).toMatchObject({
      id: 1026,
      name: "The Legend of Zelda: The Wind Waker",
      franchise: "The Legend of Zelda",
      platforms: ["Wii U", "GameCube"],
      steamAppId: 10140,
      year: 2003,
      released: true,
    });
    expect(details?.coverUrl).toContain("co2abc");
    expect(details?.genres).toEqual(["Adventure", "Role-playing (RPG)", "Puzzle"]);
  });

  it("marks unreleased and rumored games", () => {
    const unreleased = parseIgdbGamePayload(
      { id: 1, name: "Soon", first_release_date: 1893456000 },
      now,
    );
    expect(unreleased?.released).toBe(false);
    const rumored = parseIgdbGamePayload({ id: 2, name: "Maybe", game_status: 7 }, now);
    expect(rumored?.released).toBe(false);
  });

  it("skips DLC and mods in search hits and caps at 8", () => {
    const hits = parseIgdbSearchHits(
      [
        { id: 1, name: "Main", game_type: 0, platforms: [6] },
        { id: 2, name: "DLC", game_type: 1, platforms: [6] },
        { id: 3, name: "Mod", category: 5, platforms: [6] },
        { id: 4, name: "Remaster", game_type: 9, platforms: [130] },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: 10 + index,
          name: `Extra ${index}`,
          game_type: 0,
          platforms: [8],
        })),
      ],
      now,
    );
    expect(hits.map((hit) => hit.name)).toContain("Main");
    expect(hits.map((hit) => hit.name)).toContain("Remaster");
    expect(hits.map((hit) => hit.name)).not.toContain("DLC");
    expect(hits.map((hit) => hit.name)).not.toContain("Mod");
    expect(hits).toHaveLength(8);
  });

  it("reads Steam ids from store URLs when category is missing", () => {
    expect(
      steamAppIdFromExternals([
        { url: "https://store.steampowered.com/app/1245620/Elden_Ring/" },
      ]),
    ).toBe(1245620);
  });
});

describe("catalog field mapping", () => {
  const details = parseIgdbGamePayload(
    {
      id: 99,
      name: "Pragmata",
      slug: "pragmata",
      cover: { image_id: "cover99" },
      genres: [{ name: "Action" }, { name: "Adventure" }],
      collections: [{ name: "Capcom" }],
      platforms: [6, 167],
      first_release_date: 1700000000,
    },
    now,
  )!;

  it("clamps genres to two and optionally attaches Steam", () => {
    const fields = catalogFieldsFromIgdb(details);
    expect(fields.genres).toEqual(["Action", "Adventure"]);
    expect(fields.platforms).toEqual(["PC", "PS5"]);
    expect(fields.steamAppId).toBeUndefined();
  });

  it("keeps existing catalog fields when IGDB omits them", () => {
    const merged = mergeCatalogFields(
      {
        name: "Old",
        coverUrl: "https://example/old.jpg",
        genres: ["JRPG"],
        franchise: "Kept",
        platforms: ["Switch"],
        steamAppId: 42,
      },
      {
        ...details,
        name: "",
        coverUrl: "",
        genres: [],
        franchise: "",
        platforms: [],
        steamAppId: null,
      },
    );
    expect(merged.name).toBe("Old");
    expect(merged.coverUrl).toBe("https://example/old.jpg");
    expect(merged.genres).toEqual(["JRPG"]);
    expect(merged.franchise).toBe("Kept");
    expect(merged.platforms).toEqual(["Switch"]);
    expect(merged.steamAppId).toBe(42);
  });
});

describe("helpers", () => {
  it("requires both twitch credentials", () => {
    expect(hasIgdbCredentials({ clientId: "a", clientSecret: "b" })).toBe(true);
    expect(hasIgdbCredentials({ clientId: "a", clientSecret: "  " })).toBe(false);
    expect(hasIgdbCredentials(null)).toBe(false);
  });

  it("escapes apicalypse strings and builds queries", () => {
    expect(escapeApicalypseString('say "hi"')).toBe('say \\"hi\\"');
    expect(igdbSearchQuery("Wind Waker")).toContain('search "Wind Waker"');
    expect(igdbGameQuery({ kind: "id", value: 1026 })).toContain("where id = 1026;");
    expect(igdbGameQuery({ kind: "slug", value: "wind-waker" })).toContain(
      'where slug = "wind-waker";',
    );
  });

  it("formats search supporting text", () => {
    expect(
      supportingTextForHit({
        id: 1,
        name: "X",
        coverUrl: "",
        year: 2003,
        platforms: ["GameCube", "Wii U", "Switch", "PC"],
      }),
    ).toBe("2003 · GameCube, Wii U, Switch");
  });
});
