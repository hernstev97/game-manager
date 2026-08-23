import { describe, expect, it } from "vitest";
import { normalizeGame, type GameRecord } from "../game-fields";
import {
  addBulkListValues,
  appendBulkQueue,
  deleteSelectedGames,
  removeBulkListValues,
  removeBulkQueue,
  setBulkBooleanField,
  setBulkFranchise,
} from "./operations";

function game(id: string, extra: Partial<GameRecord> = {}): GameRecord {
  return normalizeGame({ id, name: id, extension: { preserved: true }, ...extra });
}

describe("bulk field operations", () => {
  it("patches only selected booleans and preserves inputs and unknown keys", () => {
    const input = [game("a"), game("b", { played: true })];
    const result = setBulkBooleanField(input, ["a"], "played", true);

    expect(result.after.map((item) => item.played)).toEqual([true, true]);
    expect(input[0]?.played).toBe(false);
    expect(result.after[0]?.extension).toEqual({ preserved: true });
    expect(result.undo.changes.map((change) => change.entityId)).toEqual(["a"]);
  });

  it("adds and removes list values case-insensitively and idempotently", () => {
    const input = [game("a", { platforms: ["PC"], genres: ["RPG"] })];
    const platforms = addBulkListValues(input, ["a"], "platforms", [" pc ", "PS5", "PS5"]);
    const again = addBulkListValues(platforms.after, ["a"], "platforms", ["ps5"]);
    const genres = removeBulkListValues(input, ["a"], "genres", ["rpg"]);

    expect(platforms.after[0]?.platforms).toEqual(["PC", "PS5"]);
    expect(again.after[0]?.platforms).toEqual(["PC", "PS5"]);
    expect(again.undo.changes).toHaveLength(0);
    expect(genres.after[0]?.genres).toEqual([]);
  });

  it("normalizes franchise input without replacing future fields", () => {
    const result = setBulkFranchise([game("a")], ["a"], "  Pokémon  ");
    expect(result.after[0]).toMatchObject({
      franchise: "Pokémon",
      extension: { preserved: true },
    });
  });
});

describe("bulk queue and ranking safety", () => {
  it("appends selected games in visible order and leaves a unique dense queue", () => {
    const input = [
      game("a", { queuePosition: 8 }),
      game("b", { queuePosition: 2 }),
      game("c"),
      game("d", { queuePosition: 4 }),
    ];
    const result = appendBulkQueue(input, ["a", "c"], ["c", "a", "b"]);
    const queue = result.after
      .filter((item) => item.queuePosition !== null)
      .sort((left, right) => (left.queuePosition ?? 0) - (right.queuePosition ?? 0));

    expect(queue.map((item) => [item.id, item.queuePosition])).toEqual([
      ["b", 1],
      ["d", 2],
      ["c", 3],
      ["a", 4],
    ]);
  });

  it("removes queue members and normalizes gaps", () => {
    const result = removeBulkQueue(
      [game("a", { queuePosition: 1 }), game("b", { queuePosition: 7 })],
      ["a"],
    );
    expect(result.after.map((item) => item.queuePosition)).toEqual([null, 1]);
  });

  it("deletes atomically while normalizing queue and favorite ranks independently", () => {
    const input = [
      game("a", { queuePosition: 1, favoriteRank: 10 }),
      game("b", { queuePosition: 9, favoriteRank: 3 }),
      game("c", { queuePosition: 9, favoriteRank: 3 }),
    ];
    const result = deleteSelectedGames(input, ["b"]);

    expect(result.after.map((item) => [item.id, item.queuePosition, item.favoriteRank])).toEqual([
      ["a", 1, 2],
      ["c", 2, 1],
    ]);
    expect(new Set(result.after.map((item) => item.favoriteRank)).size).toBe(2);
    expect(result.undo).toMatchObject({ label: "Ausgewählte Spiele löschen" });
    expect(result.undo.changes.find((change) => change.entityId === "b")?.after).toBeNull();
    expect(result.before).toHaveLength(3);
  });

  it("repairs duplicate favorite ranks on any patch and keeps them unique", () => {
    const result = setBulkBooleanField(
      [game("a", { favoriteRank: 5 }), game("b", { favoriteRank: 5 })],
      ["a", "b"],
      "owned",
      true,
    );
    expect(result.after.map((item) => item.favoriteRank)).toEqual([1, 2]);
    expect(new Set(result.after.map((item) => item.favoriteRank)).size).toBe(2);
  });
});
