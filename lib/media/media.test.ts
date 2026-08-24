import { describe, expect, it } from "vitest";
import { normalizeGame } from "@/lib/game-fields";
import { buildLandscapeCandidates, buildPortraitCandidates } from "@/lib/media/candidates";
import { artworkTransformStyle } from "@/lib/media/focal-style";
import { isRemoteImageUrl, normalizeRemoteImageUrl } from "@/lib/media/remote-url";
import { createDirtyMediaPatch, createMediaSelectionPatch } from "@/lib/media/selection";
import type { ArtworkDraft } from "@/lib/media/types";

const timestamp = "2026-08-22T10:00:00.000Z";

function game() {
  return normalizeGame({
    id: "game-1",
    name: "Portrait Test",
    steamAppId: 42,
    igdbId: 99,
    coverUrl: "https://covers.test/header.jpg",
    landscapeArtwork: {
      url: "https://covers.test/header.jpg",
      source: "steam",
      updatedAt: timestamp,
    },
    caseArtwork: {
      url: "https://covers.test/case.jpg",
      source: "manual",
      updatedAt: timestamp,
      focalPointX: 0.2,
      focalPointY: 0.8,
      zoom: 1.4,
    },
  });
}

describe("media candidates", () => {
  it("prioritizes case artwork and keeps portrait and landscape candidates separate", () => {
    const portrait = buildPortraitCandidates(game(), {
      igdbPortraitUrl: "https://igdb.test/cover.jpg",
    });
    const landscape = buildLandscapeCandidates(game());

    expect(portrait[0]).toMatchObject({ id: "current-case", orientation: "portrait" });
    expect(portrait.map((item) => item.id)).toEqual([
      "current-case",
      "igdb-portrait",
      "landscape-as-portrait",
      "steam-library",
      "portrait-placeholder",
    ]);
    expect(landscape.map((item) => item.id)).toEqual([
      "current-landscape",
      "steam-header",
      "landscape-placeholder",
    ]);
  });

  it("falls back through existing cover, Steam portrait, then placeholder", () => {
    const fallback = buildPortraitCandidates(normalizeGame({
      id: "fallback",
      coverUrl: "https://covers.test/existing.jpg",
      steamAppId: 7,
    }));
    expect(fallback.map((item) => item.id)).toEqual([
      "existing-cover",
      "steam-library",
      "portrait-placeholder",
    ]);
  });
});
describe("remote image URLs", () => {
  it.each([
    ["https://images.test/a.jpg#fragment", "https://images.test/a.jpg"],
    [" http://images.test/a.png ", "http://images.test/a.png"],
    ["data:image/png;base64,abc", null],
    ["blob:https://images.test/id", null],
    ["/local/image.png", null],
    ["file:///tmp/image.png", null],
  ])("normalizes %s without accepting non-remote schemes", (input, expected) => {
    expect(normalizeRemoteImageUrl(input)).toBe(expected);
    expect(isRemoteImageUrl(input)).toBe(expected !== null);
  });
});

describe("artwork transforms", () => {
  it("maps focal point and zoom without changing the frame ratio", () => {
    expect(artworkTransformStyle({ focalPointX: 0.25, focalPointY: 0.75, zoom: 1.5 })).toEqual({
      objectPosition: "25% 75%",
      transform: "scale(1.5)",
    });
    expect(artworkTransformStyle({ focalPointX: -2, focalPointY: 8, zoom: 99 })).toEqual({
      objectPosition: "0% 100%",
      transform: "scale(4)",
    });
  });
});

describe("media selection patches", () => {
  const portraitDraft: ArtworkDraft = {
    candidate: {
      id: "igdb",
      label: "IGDB",
      orientation: "portrait",
      kind: "igdb",
      url: "https://igdb.test/case.jpg",
      source: "igdb",
      sourceRef: "99",
    },
    focalPointX: 0.3,
    focalPointY: 0.6,
    zoom: 1.2,
  };

  it("creates an atomic landscape bridge and precise provenance", () => {
    const draft: ArtworkDraft = {
      ...portraitDraft,
      candidate: {
        ...portraitDraft.candidate,
        orientation: "landscape",
        url: "https://steam.test/header.jpg",
        source: "steam",
      },
    };
    expect(createMediaSelectionPatch("landscape", draft, { name: { source: "manual", updatedAt: timestamp } }, timestamp)).toEqual({
      coverUrl: "https://steam.test/header.jpg",
      landscapeArtwork: expect.objectContaining({
        url: "https://steam.test/header.jpg",
        source: "steam",
        focalPointX: 0.3,
        focalPointY: 0.6,
        zoom: 1.2,
      }),
      provenance: {
        name: { source: "manual", updatedAt: timestamp },
        coverUrl: expect.objectContaining({ source: "steam", updatedAt: timestamp }),
        landscapeArtwork: expect.objectContaining({ source: "steam", updatedAt: timestamp }),
      },
    });
  });

  it("does not create any patch until an orientation is explicitly dirty", () => {
    expect(createDirtyMediaPatch({
      drafts: { portrait: portraitDraft },
      dirty: new Set(),
      currentProvenance: {},
      updatedAt: timestamp,
    })).toBeNull();

    const patch = createDirtyMediaPatch({
      drafts: { portrait: portraitDraft },
      dirty: new Set(["portrait"]),
      currentProvenance: {},
      updatedAt: timestamp,
    });
    expect(patch).toMatchObject({
      caseArtwork: { url: "https://igdb.test/case.jpg", source: "igdb" },
      provenance: { caseArtwork: { source: "igdb", sourceRef: "99" } },
    });
    expect(patch).not.toHaveProperty("coverUrl");
    expect(patch).not.toHaveProperty("landscapeArtwork");
  });

  it("refuses to emit a persisted asset for a non-http URL", () => {
    expect(() => createMediaSelectionPatch("portrait", {
      ...portraitDraft,
      candidate: { ...portraitDraft.candidate, url: "blob:https://local.test/id" },
    }, {}, timestamp)).toThrow(/http\(s\)/);
  });
});
