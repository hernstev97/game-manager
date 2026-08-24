import type { GameRecord } from "../game-fields";
import type { JsonValue, UndoChange } from "../model";
import { normalizeGamePositions } from "../priority";

export type BulkUndoDescription = {
  label: string;
  changes: UndoChange[];
};

export type BulkMutationResult = {
  before: GameRecord[];
  after: GameRecord[];
  affectedIds: string[];
  undo: BulkUndoDescription;
};

export function cloneBulkValue<T>(value: T): T {
  return structuredClone(value);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function asUndoValue(value: unknown): JsonValue {
  return cloneBulkValue(value) as JsonValue;
}

export function createBulkMutationResult(
  input: readonly GameRecord[],
  candidate: readonly GameRecord[],
  label: string,
): BulkMutationResult {
  const before = cloneBulkValue([...input]);
  const after = cloneBulkValue(normalizeGamePositions(candidate));
  const beforeById = new Map(before.map((game) => [game.id, game]));
  const afterById = new Map(after.map((game) => [game.id, game]));
  const orderedIds = [
    ...before.map((game) => game.id),
    ...after.map((game) => game.id).filter((id) => !beforeById.has(id)),
  ];
  const changes: UndoChange[] = [];

  for (const id of orderedIds) {
    const previous = beforeById.get(id) ?? null;
    const next = afterById.get(id) ?? null;
    if (canonicalJson(previous) === canonicalJson(next)) continue;
    changes.push({
      entity: "game",
      entityId: id,
      before: asUndoValue(previous),
      after: asUndoValue(next),
    });
  }

  return {
    before,
    after,
    affectedIds: changes.map((change) => change.entityId),
    undo: { label, changes },
  };
}
