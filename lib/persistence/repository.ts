import {
  buildLibraryDocument,
  parseLibraryDocument,
} from "./migration";
import {
  DEFAULT_SETTINGS,
  type LibraryDocument,
  type LibrarySettings,
} from "./schema";
import type { GameRecord } from "../game-fields";

export const LIBRARY_STORAGE_KEY = "game-library.v1";

export type LibraryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type LibraryRepository = {
  load: () => LibraryDocument | null;
  save: (document: LibraryDocument) => void;
  empty: () => LibraryDocument;
  build: (
    games: readonly GameRecord[],
    settings: LibrarySettings,
    exportedAt?: string,
  ) => LibraryDocument;
};

function browserStorage(): LibraryStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function createLibraryRepository(storage?: LibraryStorage): LibraryRepository {
  const resolveStorage = () => storage ?? browserStorage();

  return {
    load: () => {
      const target = resolveStorage();
      if (!target) return null;
      const raw = target.getItem(LIBRARY_STORAGE_KEY);
      if (!raw) return null;
      const { document } = parseLibraryDocument(JSON.parse(raw));
      return document;
    },
    save: (document) => {
      const target = resolveStorage();
      if (!target) return;
      target.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(document));
    },
    empty: () => buildLibraryDocument([], DEFAULT_SETTINGS),
    build: buildLibraryDocument,
  };
}

export const libraryRepository = createLibraryRepository();

export function loadLibraryDocument(): LibraryDocument | null {
  return libraryRepository.load();
}

export function saveLibraryDocument(document: LibraryDocument): void {
  libraryRepository.save(document);
}

export function emptyLibraryDocument(): LibraryDocument {
  return libraryRepository.empty();
}
