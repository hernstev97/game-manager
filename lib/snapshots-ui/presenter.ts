import type { SnapshotReason } from "@/lib/model";
import type { SnapshotErrorCode } from "@/lib/persistence/snapshots-errors";
import type { StoredLibrarySnapshot } from "@/lib/persistence/snapshots";

export type PresentedSnapshot = {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  reason: SnapshotReason;
  reasonLabel: string;
  documentVersion: number;
  gameCount: number;
  viewCount: number;
  sizeBytes: number;
  sizeLabel: string;
  protected: boolean;
  gameNames: string[];
  remainingGames: number;
  viewNames: string[];
  remainingViews: number;
};

export type SnapshotErrorPresentation = {
  title: string;
  detail: string;
  suggestion: string;
};

export type SnapshotConfirmation = {
  title: string;
  detail: string;
  confirmLabel: string;
  destructive: boolean;
};

const REASON_LABELS: Record<SnapshotReason, string> = {
  "before-import": "Vor einem Import",
  "before-clear": "Vor dem Leeren",
  "before-bulk-delete": "Vor einer Mehrfachlöschung",
  "before-large-metadata-apply": "Vor einer großen Metadatenänderung",
  "before-restore": "Vor einer Wiederherstellung",
  daily: "Täglicher Snapshot",
  manual: "Manueller Snapshot",
};

const ERROR_PRESENTATIONS: Record<SnapshotErrorCode, SnapshotErrorPresentation> = {
  "quota-exceeded": {
    title: "Lokaler Speicher ist voll",
    detail: "Der Snapshot konnte nicht im lokalen Gerätespeicher gesichert werden.",
    suggestion: "Lösche nicht mehr benötigte, ungeschützte Snapshots und versuche es erneut.",
  },
  "storage-unavailable": {
    title: "Snapshot-Speicher ist nicht verfügbar",
    detail: "Der Browser stellt den lokalen Snapshot-Speicher derzeit nicht bereit.",
    suggestion: "Prüfe Privatmodus und Website-Speicherrechte oder versuche es in einem anderen Browserfenster.",
  },
  "serialization-failed": {
    title: "Bibliothek konnte nicht vorbereitet werden",
    detail: "Die aktuellen Bibliotheksdaten ließen sich nicht in einem Snapshot ablegen.",
    suggestion: "Exportiere wenn möglich eine Sicherung und lade die App neu.",
  },
  "transaction-failed": {
    title: "Speichervorgang wurde abgebrochen",
    detail: "Der lokale Snapshot-Speicher hat den Vorgang nicht abgeschlossen.",
    suggestion: "Versuche es erneut. Deine Bibliothek wurde durch diesen Fehler nicht wiederhergestellt oder gelöscht.",
  },
  "not-found": {
    title: "Snapshot nicht mehr gefunden",
    detail: "Der ausgewählte Snapshot ist nicht mehr im lokalen Speicher vorhanden.",
    suggestion: "Lade die Liste neu und wähle einen vorhandenen Snapshot.",
  },
  unknown: {
    title: "Snapshot-Aktion fehlgeschlagen",
    detail: "Der lokale Snapshot-Speicher konnte die Aktion nicht abschließen.",
    suggestion: "Versuche es erneut. Bleibt der Fehler bestehen, exportiere deine Bibliothek als Sicherung.",
  },
};

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function visibleName(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function errorCode(error: unknown): SnapshotErrorCode {
  if (!error || typeof error !== "object" || !("code" in error)) return "unknown";
  const code = error.code;
  return typeof code === "string" && code in ERROR_PRESENTATIONS
    ? code as SnapshotErrorCode
    : "unknown";
}

export function sortSnapshotsForDisplay(
  snapshots: readonly StoredLibrarySnapshot[],
): StoredLibrarySnapshot[] {
  return [...snapshots].sort((left, right) => {
    const byDate = timestamp(right.reference.createdAt) - timestamp(left.reference.createdAt);
    return byDate || right.reference.id.localeCompare(left.reference.id);
  });
}

export function formatSnapshotDate(
  value: string,
  locale = "de-DE",
  timeZone = "Europe/Berlin",
): string {
  const parsed = timestamp(value);
  if (!Number.isFinite(parsed)) return "Unbekanntes Datum";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(parsed));
}

export function formatSnapshotSize(sizeBytes: number, locale = "de-DE"): string {
  const bytes = Number.isFinite(sizeBytes) ? Math.max(0, sizeBytes) : 0;
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const maximumFractionDigits = value < 10 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)} ${units[unitIndex]}`;
}

export function snapshotReasonLabel(reason: SnapshotReason): string {
  return REASON_LABELS[reason];
}

export function presentSnapshot(
  snapshot: StoredLibrarySnapshot,
  options: { locale?: string; timeZone?: string; previewLimit?: number } = {},
): PresentedSnapshot {
  const previewLimit = Math.max(0, Math.floor(options.previewLimit ?? 5));
  const games = snapshot.document.games.map((game, index) =>
    visibleName(game.name, `Unbenanntes Spiel ${index + 1}`));
  const views = snapshot.document.savedViews.map((view, index) =>
    visibleName(view.name, `Unbenannte Ansicht ${index + 1}`));
  return {
    id: snapshot.reference.id,
    createdAt: snapshot.reference.createdAt,
    createdAtLabel: formatSnapshotDate(
      snapshot.reference.createdAt,
      options.locale,
      options.timeZone,
    ),
    reason: snapshot.reference.reason,
    reasonLabel: snapshotReasonLabel(snapshot.reference.reason),
    documentVersion: snapshot.reference.documentVersion,
    gameCount: snapshot.metadata.gameCount,
    viewCount: snapshot.metadata.viewCount,
    sizeBytes: snapshot.metadata.sizeBytes,
    sizeLabel: formatSnapshotSize(snapshot.metadata.sizeBytes, options.locale),
    protected: snapshot.metadata.protected,
    gameNames: games.slice(0, previewLimit),
    remainingGames: Math.max(0, games.length - previewLimit),
    viewNames: views.slice(0, previewLimit),
    remainingViews: Math.max(0, views.length - previewLimit),
  };
}

export function presentSnapshotError(error: unknown): SnapshotErrorPresentation {
  return ERROR_PRESENTATIONS[errorCode(error)];
}

export function nextProtectionValue(snapshot: Pick<PresentedSnapshot, "protected">): boolean {
  return !snapshot.protected;
}

export function confirmationForSnapshot(
  kind: "restore" | "delete",
  snapshot: Pick<PresentedSnapshot, "createdAtLabel">,
): SnapshotConfirmation {
  if (kind === "restore") {
    return {
      title: "Bibliothek wiederherstellen?",
      detail: `Der Stand vom ${snapshot.createdAtLabel} ersetzt die aktuelle Bibliothek. Direkt davor muss ein geschützter Sicherheitssnapshot des aktuellen Stands erstellt werden.`,
      confirmLabel: "Mit Sicherheitssnapshot wiederherstellen",
      destructive: false,
    };
  }
  return {
    title: "Snapshot endgültig löschen?",
    detail: `Der Snapshot vom ${snapshot.createdAtLabel} wird aus dem lokalen Speicher entfernt. Die Bibliothek selbst bleibt unverändert.`,
    confirmLabel: "Snapshot löschen",
    destructive: true,
  };
}
