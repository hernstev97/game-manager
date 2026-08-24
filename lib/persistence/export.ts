import type { GameRecord } from "../game-fields";
import {
  DEFAULT_BACKUP_SECRET_SELECTION,
  type BackupSecretSelection,
  type LibraryBackupV2,
  type LibraryCredentials,
  type LibraryDocumentV2,
} from "../model/library-document";
import { isoDateTimeSchema } from "../model/value-schemas";
import {
  buildLibraryDocument,
  canonicalDocumentForWrite,
} from "./migration";
import { libraryCredentialsSchema, type LibrarySettings } from "./schema";

export function createLibraryBackup(
  document: LibraryDocumentV2,
  selection: BackupSecretSelection = DEFAULT_BACKUP_SECRET_SELECTION,
  credentials?: LibraryCredentials,
): LibraryBackupV2 {
  const canonical = canonicalDocumentForWrite(document);
  if (selection.mode === "exclude") return canonical;
  if (!credentials) {
    throw new Error("Credentials are required for an explicitly sensitive backup");
  }
  return {
    ...canonical,
    sensitive: {
      inclusion: "explicit-user-consent",
      warningAcknowledgedAt: isoDateTimeSchema.parse(
        selection.warningAcknowledgedAt,
      ),
      credentials: libraryCredentialsSchema.parse(credentials),
    },
  };
}

export function serializeLibraryBackup(backup: LibraryBackupV2): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

/** Standard compatibility export. Secrets are excluded unless explicitly selected. */
export function exportLibraryJson(
  games: readonly GameRecord[],
  settings: LibrarySettings,
  selection: BackupSecretSelection = DEFAULT_BACKUP_SECRET_SELECTION,
): string {
  const document = buildLibraryDocument(games, settings);
  return serializeLibraryBackup(
    createLibraryBackup(
      document,
      selection,
      selection.mode === "include"
        ? {
            steamApiKey: settings.steamApiKey,
            igdbClientSecret: settings.igdbClientSecret,
          }
        : undefined,
    ),
  );
}

/** Unsupported future documents are exportable only as their untouched input. */
export function exportOpaqueLibraryInput(raw: unknown): string {
  return `${JSON.stringify(raw, null, 2)}\n`;
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mime = "application/json",
) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
