"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ImportConflictResolution,
  ImportMode,
} from "@/lib/model/import-contracts";
import { planLibraryImport, type PreparedImportPlan } from "@/lib/import-export";
import { libraryRepository } from "@/lib/storage";
import { useLibrary } from "@/store/library";
import styles from "./backup-import.module.css";
import { IconClose } from "@/components/m3/icons";

const RESOLUTION_LABELS: Record<ImportConflictResolution, string> = {
  "use-incoming": "Importierten Eintrag verwenden",
  "keep-existing": "Bestehenden Eintrag behalten",
  "import-as-new": "Als neuen Eintrag importieren",
  "cancel-import": "Import abbrechen",
};

export function BackupImportDialog({
  open,
  raw,
  fileName,
  onClose,
  onApplied,
}: {
  open: boolean;
  raw: unknown;
  fileName: string;
  onClose: () => void;
  onApplied: (result: { games: number; views: number; mode: ImportMode }) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const applyImportPlan = useLibrary((state) => state.applyImportPlan);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [resolutions, setResolutions] = useState<Record<string, ImportConflictResolution>>({});
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState("");
  const planned = useMemo(() => {
    try {
      const current = libraryRepository.load() ?? libraryRepository.empty();
      return { plan: planLibraryImport(raw, current, mode, { resolutions }) } as const;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Sicherung ist ungültig.",
      } as const;
    }
  }, [mode, raw, resolutions]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const plan = "plan" in planned ? planned.plan : undefined;
  const apply = async () => {
    if (!plan?.canApply) return;
    setBusy(true);
    setApplyError("");
    try {
      const selectedPlan: PreparedImportPlan = includeSecrets
        ? plan
        : { ...plan, containsSensitiveValues: false, sensitiveCredentials: undefined };
      const result = await applyImportPlan(selectedPlan);
      onApplied({
        games: result.document.games.length,
        views: result.document.savedViews.length,
        mode,
      });
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="backup-import-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClose={() => { if (open && !busy) onClose(); }}
    >
      <header>
        <div>
          <h1 id="backup-import-title">Sicherung prüfen</h1>
          <p>{fileName}</p>
        </div>
        <button type="button" aria-label="Importprüfung schließen" disabled={busy} onClick={onClose}><IconClose width={20} height={20} /></button>
      </header>
      {"error" in planned ? (
        <p className={styles.error} role="alert">{planned.error}</p>
      ) : plan ? (
        <div className={styles.body}>
          <fieldset className={styles.modeChoice} disabled={busy}>
            <legend>Importmodus</legend>
            <label>
              <input type="radio" name="import-mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
              <span><strong>Zusammenführen</strong> – bestehende Bibliothek ergänzen</span>
            </label>
            <label>
              <input type="radio" name="import-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
              <span><strong>Ersetzen</strong> – Bibliothek vollständig aus der Sicherung wiederherstellen</span>
            </label>
          </fieldset>
          <dl className={styles.summary}>
            <div><dt>Quellformat</dt><dd>v{plan.sourceVersion}</dd></div>
            <div><dt>Spiele danach</dt><dd>{plan.candidate.games.length}</dd></div>
            <div><dt>Ansichten danach</dt><dd>{plan.candidate.savedViews.length}</dd></div>
            <div><dt>Konflikte</dt><dd>{plan.conflicts.length}</dd></div>
          </dl>
          {plan.conflicts.length ? (
            <section className={styles.conflicts} aria-labelledby="import-conflicts-title">
              <h2 id="import-conflicts-title">Konflikte auflösen</h2>
              {plan.conflicts.map((conflict) => (
                <label key={conflict.id}>
                  <span>{conflict.entity}: {conflict.incomingId ?? conflict.code}</span>
                  <select
                    value={conflict.resolution ?? ""}
                    disabled={busy}
                    onChange={(event) => setResolutions((current) => ({
                      ...current,
                      [conflict.id]: event.target.value as ImportConflictResolution,
                    }))}
                  >
                    <option value="">Bitte entscheiden…</option>
                    {conflict.allowedResolutions.map((resolution) => (
                      <option key={resolution} value={resolution}>{RESOLUTION_LABELS[resolution]}</option>
                    ))}
                  </select>
                </label>
              ))}
            </section>
          ) : null}
          {plan.containsSensitiveValues ? (
            <label className={styles.secretChoice}>
              <input
                type="checkbox"
                checked={includeSecrets}
                disabled={busy}
                onChange={(event) => setIncludeSecrets(event.target.checked)}
              />
              <span>
                <strong>Enthaltene Zugangsdaten übernehmen</strong>
                <small>Nur aktivieren, wenn die Sicherung aus einer vertrauenswürdigen Quelle stammt.</small>
              </span>
            </label>
          ) : null}
          <p className={styles.snapshotNote}>Vor der Übernahme wird automatisch ein lokaler Sicherheits-Snapshot erstellt.</p>
          {applyError ? <p className={styles.error} role="alert">{applyError}</p> : null}
        </div>
      ) : null}
      <footer>
        <button type="button" disabled={busy} onClick={onClose}>Abbrechen</button>
        <button type="button" className={styles.primary} disabled={busy || !plan?.canApply} onClick={() => void apply()}>
          {busy ? "Wird importiert…" : mode === "replace" ? "Sicherung wiederherstellen" : "Sicherung zusammenführen"}
        </button>
      </footer>
    </dialog>
  );
}
