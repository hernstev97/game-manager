import { describe, expect, it } from "vitest";
import { normalizeGame, type GameRecord } from "./game-fields";
import {
  applyPositionReorderRequest,
  createPositionReorderModel,
  createPositionReorderRequest,
} from "./planning";
import {
  assignPriority,
  compactPriorities,
  deleteGamesAndNormalizePositions,
  insertQueueFirst,
  insertQueueLast,
  moveFavoriteToFirst,
  movePriorityToFront,
  normalizeGamePositions,
  normalizePositionField,
  removeFavoriteRank,
  removeFromQueue,
  reorderVisibleFavorites,
  reorderVisiblePriorities,
  reorderVisibleQueue,
  setFavoriteRank,
} from "./priority";

type RankedGame = {
  id: string;
  queuePosition: number | null;
  favoriteRank: number | null;
  rating: number | null;
  marker: string;
};

function rankedGame(
  id: string,
  queuePosition: number | null,
  favoriteRank: number | null,
  rating: number | null = null,
): RankedGame {
  return { id, queuePosition, favoriteRank, rating, marker: `marker-${id}` };
}

function legacyGame(id: string, priority: number | null): GameRecord {
  return normalizeGame({ id, name: id, priority });
}

describe("position normalization", () => {
  it("makes queue positions unique and dense using value then document order", () => {
    const start = [
      rankedGame("z", 4.5, 3, 7),
      rankedGame("a", 4.5, 1, 9),
      rankedGame("c", 200, 2, null),
      rankedGame("d", 0, 4, 5),
      rankedGame("e", Number.NaN, 5, 6),
    ];

    const normalized = normalizePositionField(start, "queuePosition");

    expect(normalized.map((game) => game.queuePosition)).toEqual([
      1,
      2,
      3,
      null,
      null,
    ]);
    expect(normalized.map((game) => game.favoriteRank)).toEqual([3, 1, 2, 4, 5]);
    expect(normalized.map((game) => game.rating)).toEqual([7, 9, null, 5, 6]);
    expect(start[0]?.queuePosition).toBe(4.5);
  });

  it("normalizes favorites independently and tolerates duplicate game ids", () => {
    const start = [
      rankedGame("same", 9, 5, 8),
      rankedGame("same", 2, 5, 6),
      rankedGame("other", 4, -1, 7),
    ];

    const normalized = normalizePositionField(start, "favoriteRank");

    expect(normalized.map((game) => game.favoriteRank)).toEqual([1, 2, null]);
    expect(normalized.map((game) => game.queuePosition)).toEqual([9, 2, 4]);
    expect(normalized.map((game) => game.rating)).toEqual([8, 6, 7]);
  });

  it("normalizes both independent position fields", () => {
    const normalized = normalizeGamePositions([
      rankedGame("a", 8, 10, 7),
      rankedGame("b", 3, 2, 9),
      rankedGame("c", null, 2, null),
    ]);

    expect(normalized.map((game) => game.queuePosition)).toEqual([2, 1, null]);
    expect(normalized.map((game) => game.favoriteRank)).toEqual([3, 1, 2]);
    expect(normalized.map((game) => game.rating)).toEqual([7, 9, null]);
  });

  it("deletes games and closes gaps in queue and favorites atomically", () => {
    const start = [
      rankedGame("a", 1, 3, 7),
      rankedGame("b", 2, 1, 8),
      rankedGame("c", 3, 2, 9),
    ];

    const next = deleteGamesAndNormalizePositions(start, ["b"]);

    expect(next.map((game) => [game.id, game.queuePosition, game.favoriteRank])).toEqual([
      ["a", 1, 2],
      ["c", 2, 1],
    ]);
    expect(next.map((game) => game.rating)).toEqual([7, 9]);
    expect(next.map((game) => game.marker)).toEqual(["marker-a", "marker-c"]);
  });
});

describe("favorite ranking", () => {
  it("sets, removes and moves a favorite to first without changing queue or rating", () => {
    const start = [
      rankedGame("a", 2, 1, 7),
      rankedGame("b", 1, 2, 8),
      rankedGame("c", 3, null, 9),
    ];

    const inserted = setFavoriteRank(start, "c", 2);
    expect(inserted.map((game) => game.favoriteRank)).toEqual([1, 3, 2]);
    const removed = removeFavoriteRank(inserted, "a");
    expect(removed.map((game) => game.favoriteRank)).toEqual([null, 2, 1]);
    const first = moveFavoriteToFirst(removed, "b");
    expect(first.map((game) => game.favoriteRank)).toEqual([null, 1, 2]);
    expect(first.map((game) => game.queuePosition)).toEqual([2, 1, 3]);
    expect(first.map((game) => game.rating)).toEqual([7, 8, 9]);
  });

  it("reorders only visible favorites and leaves the queue unchanged", () => {
    const start = [
      rankedGame("a", 4, 1, 7),
      rankedGame("b", 3, 2, 8),
      rankedGame("c", 2, 3, 9),
      rankedGame("d", 1, 4, 10),
    ];

    const reordered = reorderVisibleFavorites(start, ["d", "b"]);

    expect(reordered.map((game) => game.favoriteRank)).toEqual([1, 4, 3, 2]);
    expect(reordered.map((game) => game.queuePosition)).toEqual([4, 3, 2, 1]);
    expect(reordered.map((game) => game.rating)).toEqual([7, 8, 9, 10]);
  });
});

describe("queue order", () => {
  it("inserts at first and last and removes without changing favorites or rating", () => {
    const start = [
      rankedGame("a", 1, 2, 7),
      rankedGame("b", 2, 1, 8),
      rankedGame("c", null, 3, 9),
    ];

    const first = insertQueueFirst(start, "c");
    expect(first.map((game) => game.queuePosition)).toEqual([2, 3, 1]);
    const last = insertQueueLast(first, "a");
    expect(last.map((game) => game.queuePosition)).toEqual([3, 2, 1]);
    const removed = removeFromQueue(last, "b");
    expect(removed.map((game) => game.queuePosition)).toEqual([2, null, 1]);
    expect(removed.map((game) => game.favoriteRank)).toEqual([2, 1, 3]);
    expect(removed.map((game) => game.rating)).toEqual([7, 8, 9]);
  });

  it("appends a new queue member after the current last member", () => {
    const next = insertQueueLast(
      [
        rankedGame("a", 5, null),
        rankedGame("b", 20, null),
        rankedGame("c", null, null),
      ],
      "c",
    );

    expect(next.map((game) => game.queuePosition)).toEqual([1, 2, 3]);
  });

  it("reorders only visible queue members and leaves favorites unchanged", () => {
    const start = [
      rankedGame("a", 1, 4, 7),
      rankedGame("b", 2, 3, 8),
      rankedGame("c", 3, 2, 9),
      rankedGame("d", 4, 1, 10),
      rankedGame("e", null, null, null),
    ];

    const reordered = reorderVisibleQueue(start, ["d", "b", "unknown", "d"]);

    expect(reordered.map((game) => game.queuePosition)).toEqual([1, 4, 3, 2, null]);
    expect(reordered.map((game) => game.favoriteRank)).toEqual([4, 3, 2, 1, null]);
    expect(reordered.map((game) => game.rating)).toEqual([7, 8, 9, 10, null]);
  });
});

describe("reorder model", () => {
  it("provides an explicit visible-list request reusable by a planning UI", () => {
    const start = [
      rankedGame("a", 1, 3),
      rankedGame("b", 2, 2),
      rankedGame("c", 3, 1),
    ];
    const model = createPositionReorderModel(start, "queue", ["a", "c"]);
    const request = createPositionReorderRequest(model, ["c", "missing", "c", "a"]);
    const reordered = applyPositionReorderRequest(start, request);

    expect(model).toEqual({
      list: "queue",
      field: "queuePosition",
      orderedIds: ["a", "b", "c"],
      visibleOrderedIds: ["a", "c"],
    });
    expect(request).toEqual({
      field: "queuePosition",
      visibleOrderedIds: ["c", "a"],
    });
    expect(reordered.map((game) => game.queuePosition)).toEqual([3, 2, 1]);
    expect(reordered.map((game) => game.favoriteRank)).toEqual([3, 2, 1]);
  });
});

describe("legacy priority wrappers", () => {
  it("keeps legacy priority mirrored to queue position", () => {
    const start = [legacyGame("a", 1), legacyGame("b", 2), legacyGame("c", null)];
    const inserted = assignPriority(start, "c", 2);
    const front = movePriorityToFront(inserted, "b");
    const reordered = reorderVisiblePriorities(front, ["c", "a"]);
    const compacted = compactPriorities(reordered);

    expect(inserted.map((game) => game.priority)).toEqual([1, 3, 2]);
    expect(front.find((game) => game.id === "b")?.priority).toBe(1);
    expect(reordered.map((game) => game.priority)).toEqual([3, 1, 2]);
    expect(compacted.every((game) => game.priority === game.queuePosition)).toBe(true);
  });
});
