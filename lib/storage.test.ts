import { afterEach, describe, expect, it } from "vitest";
import { normalizeGame } from "./game-fields";
import { importLibraryPayload } from "./import-export";
import {
  DEFAULT_SETTINGS,
  LIBRARY_STORAGE_KEY,
  buildLibraryDocument,
  loadLibraryDocument,
  saveLibraryDocument,
} from "./storage";

function installMemoryStorage() {
  const map = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  const previous = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });
  return {
    map,
    restore() {
      if (previous === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: previous,
        });
      }
    },
  };
}

describe("library localStorage", () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  it("round-trips imported games including legacy seed ids", () => {
    const memory = installMemoryStorage();
    restore = memory.restore;

    const incoming = [
      normalizeGame({
        id: "seed-ffx-x2",
        name: "Final Fantasy X/X-2 HD Remaster",
        franchise: "Final Fantasy",
      }),
      normalizeGame({
        id: "seed-nier",
        name: "NieR:Automata",
        franchise: "Nier",
      }),
    ];
    const imported = importLibraryPayload(
      {
        version: 1,
        exportedAt: "2026-08-18T18:00:00.000Z",
        settings: DEFAULT_SETTINGS,
        games: incoming,
      },
      [],
      DEFAULT_SETTINGS,
    );

    saveLibraryDocument(imported.document);
    const loaded = loadLibraryDocument();

    expect(memory.map.get(LIBRARY_STORAGE_KEY)).toBeTruthy();
    expect(loaded?.games).toHaveLength(2);
    expect(loaded?.games.map((game) => game.id)).toEqual(["seed-ffx-x2", "seed-nier"]);
    expect(loaded?.games.map((game) => game.name)).toEqual([
      "Final Fantasy X/X-2 HD Remaster",
      "NieR:Automata",
    ]);
  });

  it("keeps a manually saved library after load", () => {
    const memory = installMemoryStorage();
    restore = memory.restore;

    const document = buildLibraryDocument(
      [normalizeGame({ id: "abc", name: "Pragmata" })],
      DEFAULT_SETTINGS,
    );
    saveLibraryDocument(document);

    expect(loadLibraryDocument()?.games.map((game) => game.name)).toEqual(["Pragmata"]);
  });

  it("throws on corrupt storage instead of pretending it is empty", () => {
    const memory = installMemoryStorage();
    restore = memory.restore;
    memory.map.set(LIBRARY_STORAGE_KEY, "{not-json");

    expect(() => loadLibraryDocument()).toThrow();
    expect(memory.map.get(LIBRARY_STORAGE_KEY)).toBe("{not-json");
  });
});
