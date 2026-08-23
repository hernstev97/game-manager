import { describe, expect, it } from "vitest";
import { defaultGameValues } from "@/lib/game-fields";
import type {
  FieldProvenance,
  ImageCheck,
  JsonValue,
  LibraryGameRecordV2,
  RemoteImageAsset,
} from "@/lib/model";
import type { IgdbGameDetails } from "@/lib/igdb";
import type { SteamAppDetails } from "@/lib/steam";
import {
  createIgdbMetadataProposal,
  createSteamMetadataProposal,
} from "./proposals";
import {
  MetadataReviewError,
  applyMetadataReview,
  applyMetadataReviews,
  canSelectMetadataChange,
  createMetadataReview,
  deselectAllMetadataChanges,
  evaluateMetadataDefaultSelection,
  isEmptyMetadataValue,
  metadataChangeWarning,
  selectAllSafeMetadataChanges,
  setMetadataChangeSelected,
  type MetadataReview,
} from "./review";
import type { MetadataProposal, MetadataReviewFieldId } from "./types";

const FETCHED_AT = "2026-08-22T10:00:00.000Z";
const APPLIED_AT = "2026-08-22T10:05:00.000Z";

function provenance(
  source: FieldProvenance["source"],
  sourceRef?: string,
): FieldProvenance {
  return {
    source,
    updatedAt: "2026-08-20T08:00:00.000Z",
    ...(sourceRef ? { sourceRef } : {}),
  };
}

function game(
  overrides: Partial<LibraryGameRecordV2> = {},
): LibraryGameRecordV2 {
  const defaults = { ...defaultGameValues() };
  delete (defaults as Partial<typeof defaults>).priority;
  return {
    ...defaults,
    id: "game-1",
    name: "Local title",
    coverUrl: "",
    queuePosition: null,
    favoriteRank: null,
    landscapeArtwork: null,
    caseArtwork: null,
    provenance: {},
    ...overrides,
  } as LibraryGameRecordV2;
}

function proposal(
  source: "steam" | "igdb",
  values: Partial<Record<MetadataReviewFieldId, JsonValue>>,
  imageChecks?: Partial<Record<MetadataReviewFieldId, ImageCheck>>,
): MetadataProposal {
  return {
    gameId: "game-1",
    source,
    sourceRef: source === "steam" ? "620" : "1026",
    fetchedAt: FETCHED_AT,
    values,
    ...(imageChecks ? { imageChecks } : {}),
  };
}

function reviewFor(
  current: LibraryGameRecordV2,
  incoming: MetadataProposal,
): MetadataReview {
  return createMetadataReview({ id: "review-1", game: current, proposal: incoming });
}

function select(
  review: MetadataReview,
  fieldId: MetadataReviewFieldId,
): MetadataReview {
  return setMetadataChangeSelected(
    review,
    { fieldId, source: review.source },
    true,
  );
}

describe("metadata default selection", () => {
  it("treats only null, whitespace and empty arrays as empty", () => {
    expect(isEmptyMetadataValue(null)).toBe(true);
    expect(isEmptyMetadataValue("  ")).toBe(true);
    expect(isEmptyMetadataValue([])).toBe(true);
    expect(isEmptyMetadataValue(false)).toBe(false);
    expect(isEmptyMetadataValue(0)).toBe(false);
    expect(isEmptyMetadataValue({})).toBe(false);
  });

  it("selects an empty target before considering its old manual provenance", () => {
    expect(
      evaluateMetadataDefaultSelection({
        fieldId: "franchise",
        currentValue: "",
        incomingValue: "Portal",
        currentProvenance: provenance("manual"),
      }),
    ).toEqual({ selected: true, reason: "empty-target" });
  });

  it("protects a nonempty manual value and leaves import/migration values for review", () => {
    expect(
      evaluateMetadataDefaultSelection({
        fieldId: "name",
        currentValue: "Hand edited",
        incomingValue: "Remote title",
        currentProvenance: provenance("manual"),
      }),
    ).toEqual({ selected: false, reason: "manual-value-protected" });

    for (const source of ["import", "migration"] as const) {
      expect(
        evaluateMetadataDefaultSelection({
          fieldId: "name",
          currentValue: "Existing title",
          incomingValue: "Remote title",
          currentProvenance: provenance(source),
        }),
      ).toEqual({
        selected: false,
        reason: "nonempty-value-review-required",
      });
    }
  });

  it("rejects empty proposals before all target rules", () => {
    expect(
      evaluateMetadataDefaultSelection({
        fieldId: "name",
        currentValue: "",
        incomingValue: "  ",
      }),
    ).toEqual({ selected: false, reason: "empty-proposal" });
  });
});

describe("source-aware proposal and diff", () => {
  it("creates a Steam proposal with a paired landscape asset and separate price", () => {
    const details: SteamAppDetails = {
      appId: 620,
      name: "Portal 2",
      coverUrl: "https://cdn.example/portal-2.jpg",
      released: true,
      price: {
        source: "steam",
        currency: "EUR",
        initialCents: 999,
        finalCents: 199,
        discountPercent: 80,
        isFree: false,
        formatted: "1,99 €",
        updatedAt: FETCHED_AT,
      },
    };
    const check: ImageCheck = { checkedAt: FETCHED_AT, result: "ok" };
    const incoming = createSteamMetadataProposal(
      "game-1",
      details,
      FETCHED_AT,
      check,
    );
    const artwork = incoming.values.landscapeArtwork as RemoteImageAsset;

    expect(incoming.sourceRef).toBe("620");
    expect(artwork).toMatchObject({
      url: details.coverUrl,
      source: "steam",
      sourceRef: "620",
      imageCheck: check,
    });

    const review = reviewFor(game({ steamAppId: 620 }), incoming);
    expect(review.metadata.map((change) => change.fieldId)).toEqual([
      "name",
      "coverUrl",
      "landscapeArtwork",
    ]);
    expect(review.volatilePrices).toHaveLength(1);
    expect(review.volatilePrices[0]).toMatchObject({
      fieldId: "steamPrice",
      source: "steam",
      selected: false,
      warning: { code: "volatile-price-separated" },
    });
  });

  it("maps IGDB portrait art to caseArtwork instead of the landscape cover bridge", () => {
    const details: IgdbGameDetails = {
      id: 1026,
      name: "The Legend of Zelda",
      slug: "the-legend-of-zelda",
      url: "https://www.igdb.com/games/the-legend-of-zelda",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg",
      genres: ["Adventure"],
      franchise: "The Legend of Zelda",
      platforms: ["Switch"],
      released: true,
      steamAppId: null,
      year: 1986,
    };
    const incoming = createIgdbMetadataProposal("game-1", details, FETCHED_AT);

    expect(incoming.values).not.toHaveProperty("coverUrl");
    expect(incoming.values.caseArtwork).toMatchObject({
      url: details.coverUrl,
      source: "igdb",
      sourceRef: "1026",
    });
  });

  it("exposes normative snapshots and UI aliases while omitting equal fields", () => {
    const current = game({
      name: "Same",
      genres: [],
      provenance: { name: provenance("import", "backup-1") },
    });
    const review = reviewFor(
      current,
      proposal("igdb", { name: "Same", genres: ["Puzzle"] }),
    );
    const change = review.metadata[0];

    expect(review.metadata).toHaveLength(1);
    expect(change).toMatchObject({
      gameId: "game-1",
      fieldId: "genres",
      category: "metadata",
      currentValue: [],
      incomingValue: ["Puzzle"],
      source: "igdb",
      selected: true,
      defaultSelection: { selected: true, reason: "empty-target" },
      proposed: {
        provenance: {
          source: "igdb",
          sourceRef: "1026",
          updatedAt: FETCHED_AT,
        },
      },
    });
  });

  it("keeps source allowlists closed", () => {
    expect(() =>
      reviewFor(
        game(),
        proposal("steam", { igdbId: 1026 }),
      ),
    ).toThrowError(MetadataReviewError);
  });
});

describe("cover and image safety", () => {
  const url = "https://cdn.example/cover.jpg";
  const artwork = (check?: ImageCheck): RemoteImageAsset => ({
    url,
    source: "steam",
    sourceRef: "620",
    updatedAt: FETCHED_AT,
    ...(check ? { imageCheck: check } : {}),
  });

  it("never preselects covers, including an empty target and a successful check", () => {
    const check: ImageCheck = { checkedAt: FETCHED_AT, result: "ok" };
    const review = reviewFor(
      game(),
      proposal(
        "steam",
        { coverUrl: url, landscapeArtwork: artwork(check) as JsonValue },
        { coverUrl: check, landscapeArtwork: check },
      ),
    );

    expect(review.metadata).toHaveLength(2);
    for (const change of review.metadata) {
      expect(change.defaultSelection).toEqual({
        selected: false,
        reason: "cover-review-required",
      });
      expect(change.selected).toBe(false);
    }
  });

  it.each(["not-found", "invalid-content"] as const)(
    "classifies %s as definitively broken and leaves it unselected",
    (result) => {
      const check: ImageCheck = { checkedAt: FETCHED_AT, result };
      const review = reviewFor(
        game(),
        proposal("igdb", { caseArtwork: artwork(check) as JsonValue }),
      );
      expect(review.metadata[0]).toMatchObject({
        selected: false,
        defaultSelection: { selected: false, reason: "defective-cover" },
        warning: { code: "image-definitively-broken", severity: "error" },
      });
    },
  );

  it.each(["offline", "timeout", "network-error", "rate-limited", "blocked"] as const)(
    "keeps a transient %s check inconclusive rather than calling it broken",
    (result) => {
      const check: ImageCheck = { checkedAt: FETCHED_AT, result };
      const review = reviewFor(
        game(),
        proposal("igdb", { caseArtwork: artwork(check) as JsonValue }),
      );
      expect(review.metadata[0]).toMatchObject({
        defaultSelection: { selected: false, reason: "cover-review-required" },
        warning: { code: "image-check-inconclusive" },
      });
    },
  );

  it("selects a matching cover/landscape pair together", () => {
    const review = reviewFor(
      game(),
      proposal("steam", {
        coverUrl: url,
        landscapeArtwork: artwork() as JsonValue,
      }),
    );
    const selected = select(review, "coverUrl");

    expect(selected.metadata.map((change) => change.selected)).toEqual([true, true]);
    const deselected = setMetadataChangeSelected(
      selected,
      { fieldId: "landscapeArtwork", source: "steam" },
      false,
    );
    expect(deselected.metadata.map((change) => change.selected)).toEqual([
      false,
      false,
    ]);
  });

  it("allows the missing half of a pair when the stored cover URL already matches", () => {
    const review = reviewFor(
      game({ coverUrl: url, landscapeArtwork: null }),
      proposal("steam", {
        coverUrl: url,
        landscapeArtwork: artwork() as JsonValue,
      }),
    );

    expect(review.metadata.map((change) => change.fieldId)).toEqual(["landscapeArtwork"]);
    expect(
      canSelectMetadataChange(review, {
        fieldId: "landscapeArtwork",
        source: "steam",
      }),
    ).toBe(true);
    expect(select(review, "landscapeArtwork").metadata[0].selected).toBe(true);
    expect(metadataChangeWarning(review, review.metadata[0])).not.toMatchObject({
      code: "paired-artwork-required",
    });
  });

  it("allows a cover URL change when the stored landscape asset already matches", () => {
    const review = reviewFor(
      game({ coverUrl: "", landscapeArtwork: artwork() }),
      proposal("steam", { coverUrl: url }),
    );

    expect(canSelectMetadataChange(review, { fieldId: "coverUrl", source: "steam" })).toBe(true);
    expect(select(review, "coverUrl").metadata[0].selected).toBe(true);
  });

  it("blocks an unpaired cover overwrite when an existing landscape bridge would break", () => {
    const current = game({
      coverUrl: "https://cdn.example/old.jpg",
      landscapeArtwork: {
        ...artwork(),
        url: "https://cdn.example/old.jpg",
      },
    });
    const review = reviewFor(current, proposal("steam", { coverUrl: url }));
    const change = review.metadata[0];

    expect(
      canSelectMetadataChange(review, { fieldId: "coverUrl", source: "steam" }),
    ).toBe(false);
    expect(metadataChangeWarning(review, change)).toMatchObject({
      code: "paired-artwork-required",
      severity: "error",
    });
    expect(() => select(review, "coverUrl")).toThrowError(MetadataReviewError);
  });
});

describe("selection helpers and volatile prices", () => {
  it("selects only normative safe defaults and clears every metadata selection", () => {
    const current = game({
      name: "Manual",
      genres: [],
      franchise: "Imported",
      provenance: {
        name: provenance("manual"),
        franchise: provenance("import"),
      },
    });
    let review = reviewFor(
      current,
      proposal("igdb", {
        name: "Remote",
        genres: ["Puzzle"],
        franchise: "Portal",
      }),
    );
    review = select(review, "franchise");
    expect(review.metadata.map((change) => change.selected)).toEqual([
      false,
      true,
      true,
    ]);

    const safe = selectAllSafeMetadataChanges(review);
    expect(safe.metadata.map((change) => change.selected)).toEqual([
      false,
      true,
      false,
    ]);
    expect(
      deselectAllMetadataChanges(safe).metadata.every((change) => !change.selected),
    ).toBe(true);
  });

  it("does not expose volatile prices through normal selection", () => {
    const steam = createSteamMetadataProposal(
      "game-1",
      {
        appId: 620,
        name: "Local title",
        coverUrl: "",
        released: true,
        price: {
          source: "steam",
          currency: "EUR",
          initialCents: 999,
          finalCents: 999,
          discountPercent: 0,
          isFree: false,
          formatted: "9,99 €",
          updatedAt: FETCHED_AT,
        },
      },
      FETCHED_AT,
    );
    const review = reviewFor(game({ steamAppId: 620, released: true }), steam);

    expect(review.metadata).toHaveLength(0);
    expect(review.volatilePrices).toHaveLength(1);
    expect(() => select(review, "steamPrice")).toThrowError(MetadataReviewError);
  });
});

describe("atomic apply and undo", () => {
  it("creates a minimal patch, correct provenance and a complete game undo", () => {
    const untouched = provenance("migration", "library-v1");
    const current = game({
      name: "Manual name",
      genres: [],
      notes: "Do not touch",
      provenance: {
        name: provenance("manual"),
        notes: untouched,
      },
      futureExtension: { keep: true },
    });
    let review = reviewFor(
      current,
      proposal("igdb", {
        name: "Remote name",
        genres: ["Puzzle", "Adventure"],
        released: false,
      }),
    );
    review = select(review, "name");
    const result = applyMetadataReview(current, review, {
      transactionId: "tx-1",
      appliedAt: APPLIED_AT,
      label: "IGDB-Metadaten übernehmen",
    });
    const patch = result.patches[0];
    const after = result.afterGames[0];

    expect(patch.fields).toEqual({
      name: "Remote name",
      genres: ["Puzzle", "Adventure"],
    });
    expect(patch.expectedValues).toEqual({ name: "Manual name", genres: [] });
    expect(patch.expectedProvenance).toEqual({
      name: provenance("manual"),
      genres: null,
    });
    expect(Object.keys(patch.provenance)).toEqual(["name", "genres"]);
    expect(patch.provenance.name).toEqual({
      source: "igdb",
      sourceRef: "1026",
      updatedAt: FETCHED_AT,
    });
    expect(after).toMatchObject({
      name: "Remote name",
      genres: ["Puzzle", "Adventure"],
      released: true,
      notes: "Do not touch",
      futureExtension: { keep: true },
    });
    expect(after.provenance.notes).toEqual(untouched);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      entity: "game",
      entityId: "game-1",
      before: current,
      after,
    });
    expect(result.transaction).toEqual({
      id: "tx-1",
      label: "IGDB-Metadaten übernehmen",
      createdAt: APPLIED_AT,
      changes: result.changes,
    });
  });

  it("rejects a stale selected field without caring about unrelated changes", () => {
    const current = game({ genres: [] });
    const review = reviewFor(
      current,
      proposal("igdb", { genres: ["Puzzle"] }),
    );
    const unrelatedUpdate = { ...current, notes: "Changed later" };

    expect(
      applyMetadataReview(unrelatedUpdate, review, {
        transactionId: "tx-1",
        appliedAt: APPLIED_AT,
      }).afterGames[0].notes,
    ).toBe("Changed later");

    expect(() =>
      applyMetadataReview(
        { ...current, genres: ["Action"] },
        review,
        { transactionId: "tx-2", appliedAt: APPLIED_AT },
      ),
    ).toThrowError(/changed after the review/);
  });

  it("validates every game before producing one batch transaction", () => {
    const first = game({ id: "game-1", genres: [] });
    const second = game({ id: "game-2", franchise: "" });
    const firstReview = reviewFor(
      first,
      proposal("igdb", { genres: ["Puzzle"] }),
    );
    const secondReview = createMetadataReview({
      id: "review-2",
      game: second,
      proposal: {
        ...proposal("igdb", { franchise: "Portal" }),
        gameId: "game-2",
      },
    });
    const result = applyMetadataReviews(
      [first, second],
      [firstReview, secondReview],
      { transactionId: "tx-batch", appliedAt: APPLIED_AT },
    );

    expect(result.afterGames.map((item) => [item.id, item.genres, item.franchise])).toEqual([
      ["game-1", ["Puzzle"], ""],
      ["game-2", [], "Portal"],
    ]);
    expect(result.patches).toHaveLength(2);
    expect(result.transaction.changes).toHaveLength(2);

    expect(() =>
      applyMetadataReviews(
        [first, { ...second, franchise: "Changed" }],
        [firstReview, secondReview],
        { transactionId: "tx-stale", appliedAt: APPLIED_AT },
      ),
    ).toThrowError(/changed after the review/);
  });

  it("rejects empty selections and structurally forged review objects", () => {
    const current = game({ name: "Manual", provenance: { name: provenance("manual") } });
    const review = reviewFor(current, proposal("igdb", { name: "Remote" }));

    expect(() =>
      applyMetadataReview(current, review, {
        transactionId: "tx-empty",
        appliedAt: APPLIED_AT,
      }),
    ).toThrowError(/At least one metadata field/);

    const forged = { ...select(review, "name") } as MetadataReview;
    expect(() =>
      applyMetadataReview(current, forged, {
        transactionId: "tx-forged",
        appliedAt: APPLIED_AT,
      }),
    ).toThrowError(/intact review contract/);
  });
});
