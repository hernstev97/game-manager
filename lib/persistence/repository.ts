import type { GameRecord } from "../game-fields";
import type {
  LibraryCredentials,
  LibraryDocumentV2,
} from "../model/library-document";
import {
  attachLibraryCompatibility,
  buildLibraryDocument,
  canonicalDocumentForWrite,
  parseLibraryDocument,
} from "./migration";
import {
  DEFAULT_CREDENTIALS,
  DEFAULT_SETTINGS,
  libraryCredentialsSchema,
  type LibraryDocument,
  type LibrarySettings,
} from "./schema";

export const LIBRARY_STORAGE_KEY = "game-library.v1";
export const LIBRARY_CREDENTIALS_STORAGE_KEY = "game-library.credentials.v1";

export type LibraryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

export type AtomicLibraryWrite = {
  document: LibraryDocumentV2;
  /** Undefined leaves the local credential sidecar unchanged. */
  credentials?: LibraryCredentials;
};

export type LibraryRepository = {
  load: () => LibraryDocument | null;
  save: (document: LibraryDocument) => void;
  writeAtomic: (write: AtomicLibraryWrite) => LibraryDocument;
  credentials: () => LibraryCredentials;
  pendingLegacyCredentials: () => LibraryCredentials | null;
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

function restoreValue(
  storage: LibraryStorage,
  key: string,
  previous: string | null,
): void {
  if (previous === null && storage.removeItem) storage.removeItem(key);
  else if (previous !== null) storage.setItem(key, previous);
}

export function createLibraryRepository(storage?: LibraryStorage): LibraryRepository {
  const resolveStorage = () => storage ?? browserStorage();
  let lastDocument: LibraryDocumentV2 | undefined;
  let legacyCredentials: LibraryCredentials | null = null;

  const readCredentials = (): LibraryCredentials => {
    const target = resolveStorage();
    if (!target) return { ...DEFAULT_CREDENTIALS };
    const raw = target.getItem(LIBRARY_CREDENTIALS_STORAGE_KEY);
    return raw
      ? libraryCredentialsSchema.parse(JSON.parse(raw))
      : { ...DEFAULT_CREDENTIALS };
  };

  const writeAtomic = (write: AtomicLibraryWrite): LibraryDocument => {
    const canonical = canonicalDocumentForWrite(write.document);
    const target = resolveStorage();
    if (!target) {
      lastDocument = canonical;
      return attachLibraryCompatibility(
        canonical,
        write.credentials ?? DEFAULT_CREDENTIALS,
      );
    }
    const previousDocument = target.getItem(LIBRARY_STORAGE_KEY);
    const previousCredentials = target.getItem(LIBRARY_CREDENTIALS_STORAGE_KEY);
    try {
      if (write.credentials !== undefined) {
        const credentials = libraryCredentialsSchema.parse(write.credentials);
        target.setItem(
          LIBRARY_CREDENTIALS_STORAGE_KEY,
          JSON.stringify(credentials),
        );
      }
      target.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(canonical));
    } catch (error) {
      restoreValue(target, LIBRARY_STORAGE_KEY, previousDocument);
      restoreValue(target, LIBRARY_CREDENTIALS_STORAGE_KEY, previousCredentials);
      throw error;
    }
    lastDocument = canonical;
    return attachLibraryCompatibility(
      canonical,
      write.credentials ?? readCredentials(),
    );
  };

  return {
    load: () => {
      const target = resolveStorage();
      if (!target) return null;
      const raw = target.getItem(LIBRARY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = parseLibraryDocument(JSON.parse(raw));
      legacyCredentials = parsed.legacyCredentials ?? null;
      lastDocument = canonicalDocumentForWrite(parsed.document);
      return attachLibraryCompatibility(lastDocument, readCredentials());
    },
    save: (document) => {
      const settings = document.settings;
      writeAtomic({
        document,
        credentials: {
          steamApiKey: settings.steamApiKey,
          igdbClientSecret: settings.igdbClientSecret,
        },
      });
    },
    writeAtomic,
    credentials: readCredentials,
    pendingLegacyCredentials: () =>
      legacyCredentials ? { ...legacyCredentials } : null,
    empty: () => buildLibraryDocument([], DEFAULT_SETTINGS),
    build: (games, settings, exportedAt) =>
      buildLibraryDocument(games, settings, exportedAt, lastDocument),
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
