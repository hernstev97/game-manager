import type {
  SteamImportCategory,
  SteamImportHandoffStatus,
  SteamImportResolution,
} from "@/lib/steam-import/types";

export type SteamImportWizardStep =
  | "load"
  | "select"
  | "options"
  | "review"
  | "report";

export const CATEGORY_LABELS: Record<SteamImportCategory, string> = {
  new: "Neu",
  "safely-recognized": "Sicher erkannt",
  "possible-match": "Möglicher Treffer",
  conflict: "Konflikt",
  "already-current": "Bereits aktuell",
};

export const STEP_LABELS = [
  ["load", "Laden"],
  ["select", "Vergleichen"],
  ["options", "Optionen"],
  ["review", "Prüfen"],
  ["report", "Bericht"],
] as const satisfies readonly (readonly [SteamImportWizardStep, string])[];

export function selectedResolutionValue(
  resolution: SteamImportResolution | undefined,
): string {
  if (!resolution) return "";
  return resolution.kind === "new" ? "new" : `existing:${resolution.gameId}`;
}

export function resolutionFromValue(
  value: string,
): SteamImportResolution | undefined {
  if (value === "new") return { kind: "new" };
  if (value.startsWith("existing:")) {
    return { kind: "existing", gameId: value.slice("existing:".length) };
  }
  return undefined;
}

export function needsResolution(category: SteamImportCategory): boolean {
  return category === "possible-match" || category === "conflict";
}

export function reportHandoffLabel(status: SteamImportHandoffStatus): string {
  if (status === "prepared") return "Übergeben";
  if (status === "failed") return "Übergabe fehlgeschlagen";
  return "Nicht angefordert";
}
