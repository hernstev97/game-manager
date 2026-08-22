import { buildLibraryDocument } from "./migration";
import type { LibrarySettings } from "./schema";
import type { GameRecord } from "../game-fields";

export function exportLibraryJson(
  games: readonly GameRecord[],
  settings: LibrarySettings,
): string {
  return `${JSON.stringify(buildLibraryDocument(games, settings), null, 2)}\n`;
}

export function downloadTextFile(filename: string, contents: string, mime = "application/json") {
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
