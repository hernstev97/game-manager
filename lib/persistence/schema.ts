import { z } from "zod";
import { LIBRARY_JSON_VERSION, type GameRecord } from "../game-fields";

export type LibrarySettings = {
  sortBy: string;
  sortDir: "asc" | "desc";
  steamId: string;
  steamApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
};

export type LibraryDocument = {
  version: number;
  exportedAt: string;
  settings: LibrarySettings;
  games: GameRecord[];
};

export const DEFAULT_SETTINGS: LibrarySettings = {
  sortBy: "name",
  sortDir: "asc",
  steamId: "",
  steamApiKey: "",
  igdbClientId: "",
  igdbClientSecret: "",
};

export const librarySettingsSchema = z
  .object({
    sortBy: z.string().catch("name"),
    sortDir: z.enum(["asc", "desc"]).catch("asc"),
    steamId: z.string().catch(""),
    steamApiKey: z.string().catch(""),
    igdbClientId: z.string().catch(""),
    igdbClientSecret: z.string().catch(""),
  })
  .passthrough();

export const libraryDocumentSchema = z
  .object({
    version: z.number().int().positive().catch(LIBRARY_JSON_VERSION),
    exportedAt: z.string().optional(),
    settings: librarySettingsSchema.catch(DEFAULT_SETTINGS),
    games: z.array(z.unknown()).catch([]),
  })
  .passthrough();
