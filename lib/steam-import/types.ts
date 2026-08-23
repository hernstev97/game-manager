import type {
  ImportApplyResult,
  ImportPlan,
  JobProgress,
  LibraryDocumentV2,
  LibraryGameRecordV2,
  MetadataChangePreview,
  PersistedJob,
} from "@/lib/model";
import type { MetadataProposal } from "@/lib/metadata/types";

export type SteamImportInputGame = {
  appId?: unknown;
  appid?: unknown;
  steamAppId?: unknown;
  name?: unknown;
  playtimeMinutes?: unknown;
  playtime_forever?: unknown;
  igdbId?: unknown;
};

export type NormalizedSteamImportGame = {
  steamAppId: number;
  name: string;
  playtimeMinutes: number | null;
  igdbId: number | null;
};

export const STEAM_NORMALIZATION_ISSUE_CODES = [
  "invalid-payload",
  "invalid-entry",
  "invalid-app-id",
  "missing-name",
  "invalid-playtime",
  "duplicate-app-id",
  "conflicting-duplicate",
] as const;

export type SteamNormalizationIssueCode =
  (typeof STEAM_NORMALIZATION_ISSUE_CODES)[number];

export type SteamNormalizationIssue = {
  code: SteamNormalizationIssueCode;
  index?: number;
  steamAppId?: number;
  severity: "warning" | "error";
  message: string;
};

export type SteamLibraryNormalizationResult = {
  games: NormalizedSteamImportGame[];
  issues: SteamNormalizationIssue[];
  received: number;
  rejected: number;
};

export const STEAM_IMPORT_CATEGORIES = [
  "new",
  "safely-recognized",
  "possible-match",
  "conflict",
  "already-current",
] as const;

export type SteamImportCategory = (typeof STEAM_IMPORT_CATEGORIES)[number];

export const STEAM_MATCH_REASONS = [
  "steam-app-id",
  "external-id",
  "normalized-name",
  "ambiguous-steam-app-id",
  "ambiguous-external-id",
  "conflicting-external-identities",
  "ambiguous-name",
  "no-match",
] as const;

export type SteamMatchReason = (typeof STEAM_MATCH_REASONS)[number];

export type SteamImportComparisonItem = {
  source: NormalizedSteamImportGame;
  category: SteamImportCategory;
  reason: SteamMatchReason;
  candidateGameIds: string[];
  matchedGameId?: string;
};

export type SteamImportComparison = {
  items: SteamImportComparisonItem[];
  counts: Record<SteamImportCategory, number>;
};

export type SteamImportResolution =
  | { kind: "existing"; gameId: string }
  | { kind: "new" };

export type SteamImportJobSelection = {
  details: boolean;
  covers: boolean;
};

export type SteamImportOperation =
  | {
      kind: "add";
      steamAppId: number;
      targetGameId: string;
      after: LibraryGameRecordV2;
    }
  | {
      kind: "update";
      steamAppId: number;
      targetGameId: string;
      before: LibraryGameRecordV2;
      after: LibraryGameRecordV2;
    };

export type SteamMetadataReviewHandoff = {
  kind: "steam-import-metadata-review";
  importPlanId: string;
  createdAt: string;
  gameIds: string[];
  proposals: MetadataProposal[];
  preview: MetadataChangePreview;
  requiresExplicitConfirmation: true;
};

export type SteamImportPlan = ImportPlan & {
  source: "steam-library";
  selectedAppIds: number[];
  operations: SteamImportOperation[];
  jobs: PersistedJob[];
  reviewHandoff: SteamMetadataReviewHandoff;
};

export type PrepareSteamImportPlanInput = {
  current: LibraryDocumentV2;
  comparison: SteamImportComparison;
  selectedAppIds: readonly number[];
  resolutions?: Readonly<Record<string, SteamImportResolution | undefined>>;
  jobs?: Partial<SteamImportJobSelection>;
  now?: string;
  createId?: (kind: "plan" | "game" | "job") => string;
};

export type SteamImportReportItem = {
  steamAppId: number;
  gameId?: string;
  status: "added" | "updated" | "skipped";
};

export type SteamImportHandoffStatus =
  | "not-requested"
  | "prepared"
  | "failed";

export type SteamImportReport = {
  importPlanId: string;
  appliedAt: string;
  added: number;
  updated: number;
  skipped: number;
  jobsPrepared: number;
  reviewChangesPrepared: number;
  jobsHandoff: SteamImportHandoffStatus;
  reviewHandoff: SteamImportHandoffStatus;
  items: SteamImportReportItem[];
  warnings: string[];
};

export type SteamLibraryLoader = (context: {
  signal: AbortSignal;
}) => Promise<unknown>;

export type SteamImportWizardProps = {
  currentDocument: LibraryDocumentV2;
  loadLibrary: SteamLibraryLoader;
  onApply: (plan: SteamImportPlan) => Promise<ImportApplyResult>;
  onJobsPrepared?: (jobs: readonly PersistedJob[]) => void | Promise<void>;
  onReviewHandoff?: (
    handoff: SteamMetadataReviewHandoff,
  ) => void | Promise<void>;
  online?: boolean;
  jobProgress?: JobProgress;
  createId?: PrepareSteamImportPlanInput["createId"];
  className?: string;
};
