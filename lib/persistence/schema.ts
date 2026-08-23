import { z } from "zod";
import {
  allThemeTokenNames,
  DEFAULT_THEME_PREFERENCES,
  schemeVariants,
} from "../theme";
import {
  DEFAULT_MOTION_PREFERENCE,
  motionPreferences,
} from "../motion";
import {
  LIBRARY_DOCUMENT_FORMAT,
  LIBRARY_DOCUMENT_VERSION,
  type LibraryCredentials,
  type LibraryDocumentV2,
} from "../model/library-document";
import type { TransitionalLibraryGameRecordV2 } from "../model/shared";
import {
  franchisePresentationSchema,
  isoDateTimeSchema,
  jsonValueSchema,
} from "../model/value-schemas";
import { DISPLAY_MODES, GROUP_BY_MODES } from "../model/views";
import { libraryGameV2Schema } from "../game-fields";
import { savedViewSchema, sortStateSchema } from "./view-schema";

export type LibrarySettings = {
  sortBy: string;
  sortDir: "asc" | "desc";
  steamId: string;
  steamApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
};

/** Compatibility facade. `settings` is attached non-enumerably by migration. */
export type LibraryDocument = LibraryDocumentV2 & {
  games: TransitionalLibraryGameRecordV2[];
  readonly settings: LibrarySettings;
};

export const DEFAULT_SETTINGS: LibrarySettings = {
  sortBy: "name",
  sortDir: "asc",
  steamId: "",
  steamApiKey: "",
  igdbClientId: "",
  igdbClientSecret: "",
};

export const DEFAULT_CREDENTIALS: LibraryCredentials = {
  steamApiKey: "",
  igdbClientSecret: "",
};

export const librarySettingsSchema = z
  .object({
    sortBy: z.string(),
    sortDir: z.enum(["asc", "desc"]),
    steamId: z.string(),
    steamApiKey: z.string(),
    igdbClientId: z.string(),
    igdbClientSecret: z.string(),
  })
  .passthrough();

export const libraryCredentialsSchema = z
  .object({
    steamApiKey: z.string(),
    igdbClientSecret: z.string(),
  })
  .passthrough();

export const integrationIdentitySettingsSchema = z
  .object({ steamId: z.string(), igdbClientId: z.string() })
  .passthrough();

const themeTokensShape = Object.fromEntries(
  allThemeTokenNames.map((token) => [token, z.string()]),
);
const themeTokenSetSchema = z.object(themeTokensShape).passthrough();

export const themePreferencesSchema = z
  .object({
    seed: z.string(),
    variant: z.enum(schemeVariants),
    mode: z.enum(["light", "dark", "system"]),
    source: z.enum(["preset", "custom", "accent", "image"]),
    pair: z
      .object({ light: themeTokenSetSchema, dark: themeTokenSetSchema })
      .passthrough(),
  })
  .passthrough();

export const sensitiveBackupEnvelopeSchema = z
  .object({
    inclusion: z.literal("explicit-user-consent"),
    warningAcknowledgedAt: isoDateTimeSchema,
    credentials: libraryCredentialsSchema,
  })
  .passthrough();

export const libraryDocumentV1Schema = z
  .object({
    format: z.literal(LIBRARY_DOCUMENT_FORMAT).optional(),
    version: z.literal(1),
    exportedAt: isoDateTimeSchema.optional(),
    settings: z
      .object({
        sortBy: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional(),
        steamId: z.string().optional(),
        steamApiKey: z.string().optional(),
        igdbClientId: z.string().optional(),
        igdbClientSecret: z.string().optional(),
      })
      .passthrough()
      .optional(),
    games: z.array(z.unknown()),
    savedViews: z.array(z.unknown()).optional(),
    defaultView: z.string().optional(),
  })
  .passthrough();

export const libraryDocumentV2Schema = z
  .object({
    format: z.literal(LIBRARY_DOCUMENT_FORMAT),
    version: z.literal(LIBRARY_DOCUMENT_VERSION),
    exportedAt: isoDateTimeSchema,
    games: z.array(libraryGameV2Schema),
    savedViews: z.array(savedViewSchema),
    defaultView: z.string().min(1),
    franchises: z.array(franchisePresentationSchema),
    theme: themePreferencesSchema,
    motion: z.enum(motionPreferences),
    displayMode: z.enum(DISPLAY_MODES),
    groupBy: z.enum(GROUP_BY_MODES),
    localUi: z
      .object({ activeSort: sortStateSchema.optional() })
      .catchall(jsonValueSchema),
    integrations: integrationIdentitySettingsSchema,
  })
  .passthrough()
  .superRefine((document, context) => {
    const unique = (
      values: readonly string[],
      path: string,
      normalize = (value: string) => value,
    ) => {
      const seen = new Set<string>();
      for (const value of values) {
        const key = normalize(value);
        if (seen.has(key)) {
          context.addIssue({ code: "custom", path: [path], message: `Duplicate ${path} identity` });
        }
        seen.add(key);
      }
    };
    unique(document.games.map((game) => String(game.id)), "games");
    unique(document.savedViews.map((view) => view.id), "savedViews");
    for (const view of document.savedViews) {
      if (
        view.kind === "custom" &&
        (view.id.startsWith("system:") ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(view.id))
      ) {
        context.addIssue({
          code: "custom",
          path: ["savedViews"],
          message: "Custom saved-view IDs must be UUIDs and may not use system:",
        });
      }
    }
    unique(
      document.franchises.map((item) => item.franchise),
      "franchises",
      (value) => value.trim().normalize("NFKC").toLocaleLowerCase("de-DE"),
    );
    for (const field of ["queuePosition", "favoriteRank"] as const) {
      const positions = document.games
        .map((game) => game[field] as number | null)
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b);
      if (positions.some((value, index) => value !== index + 1)) {
        context.addIssue({
          code: "custom",
          path: ["games"],
          message: `${field} must be unique and contiguous from 1`,
        });
      }
    }
  });

/** Compatibility name now points at the canonical v2 schema. */
export const libraryDocumentSchema = libraryDocumentV2Schema;

export function defaultDocumentPreferences() {
  return {
    theme: structuredClone(DEFAULT_THEME_PREFERENCES),
    motion: DEFAULT_MOTION_PREFERENCE,
    displayMode: "list" as const,
    groupBy: "none" as const,
    localUi: {},
  };
}
