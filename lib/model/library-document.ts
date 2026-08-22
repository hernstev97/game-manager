import type { MotionPreference } from "../motion";
import type { ThemePreferences } from "../theme";
import type {
  FranchisePresentation,
  IsoDateTime,
  JsonObject,
  LibraryGameRecordV2,
  Passthrough,
} from "./shared";
import type { DisplayMode, GroupByMode, SavedView } from "./views";

export const LIBRARY_DOCUMENT_FORMAT = "ggrid-library" as const;
export const LIBRARY_DOCUMENT_VERSION = 2 as const;
export const SUPPORTED_LIBRARY_DOCUMENT_VERSIONS = [1, 2] as const;

export const LIBRARY_INPUT_FORMS = [
  "bare-game-array",
  "version-1-document",
  "version-2-document",
] as const;

export const LIBRARY_UNKNOWN_KEY_POLICY = "passthrough" as const;

export type IntegrationIdentitySettings = Passthrough<{
  steamId: string;
  igdbClientId: string;
}>;

/**
 * Only registered, stable cross-session UI preferences belong here. Dialogs,
 * selection, drafts and hydration flags are session-only store state.
 */
export type LocalUiSettings = JsonObject;

/** Portable canonical state. It deliberately contains no API credentials. */
export type LibraryDocumentV2 = Passthrough<{
  format: typeof LIBRARY_DOCUMENT_FORMAT;
  version: typeof LIBRARY_DOCUMENT_VERSION;
  exportedAt: IsoDateTime;
  games: LibraryGameRecordV2[];
  savedViews: SavedView[];
  defaultView: string;
  franchises: FranchisePresentation[];
  theme: ThemePreferences;
  motion: MotionPreference;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  localUi: LocalUiSettings;
  integrations: IntegrationIdentitySettings;
}>;

/** Local credential sidecar; never included by the standard backup path. */
export type LibraryCredentials = Passthrough<{
  steamApiKey: string;
  igdbClientSecret: string;
}>;

export type SensitiveBackupEnvelope = Passthrough<{
  inclusion: "explicit-user-consent";
  warningAcknowledgedAt: IsoDateTime;
  credentials: LibraryCredentials;
}>;

export type LibraryBackupV2 = LibraryDocumentV2 & {
  sensitive?: SensitiveBackupEnvelope;
};

export type BackupSecretSelection =
  | { mode: "exclude" }
  | {
      mode: "include";
      warningAcknowledgedAt: IsoDateTime;
    };

export const DEFAULT_BACKUP_SECRET_SELECTION = {
  mode: "exclude",
} as const satisfies BackupSecretSelection;
