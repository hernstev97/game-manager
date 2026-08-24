import type { JsonValue, LibraryGameRecordV2 } from "@/lib/model";
import { MetadataReviewError } from "./errors";

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

export function cloneJson(value: unknown, path = "value"): JsonValue {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new MetadataReviewError(
        "invalid-proposal",
        `${path} must contain only finite JSON numbers`,
      );
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => cloneJson(item, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    const output: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) {
        throw new MetadataReviewError(
          "invalid-proposal",
          `${path}.${key} must not be undefined`,
        );
      }
      output[key] = cloneJson(item, `${path}.${key}`);
    }
    return output;
  }
  throw new MetadataReviewError(
    "invalid-proposal",
    `${path} must be JSON-serializable`,
  );
}

export function cloneGame(game: LibraryGameRecordV2): LibraryGameRecordV2 {
  return cloneJson(game, `game ${game.id}`) as LibraryGameRecordV2;
}

function canonicalJson(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function jsonEqual(left: JsonValue, right: JsonValue): boolean {
  return canonicalJson(left) === canonicalJson(right);
}
