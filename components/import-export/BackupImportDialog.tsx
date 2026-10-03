"use client";

import { useMemo, useRef, useState } from "react";
import type {
  ImportConflictResolution,
  ImportMode,
} from "@/lib/model/import-contracts";
import { planLibraryImport, type PreparedImportPlan } from "@/lib/import-export";
import { libraryRepository } from "@/lib/storage";
import { useLibrary } from "@/store/library";
import { M3Dialog, M3Select } from "@/components/m3/host";
import { IconClose } from "@/components/m3/icons";
import styles from "./backup-import.module.css";

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
  const applyImportPlan = useLibrary((state) => state.applyImportPlan);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [resolutions, setResolutions] = useState<Record<string, ImportConflictResolution>>({});
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
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

  const close = () => {
    if (!busyRef.current) onClose();
  };

  const plan = "plan" in planned ? planned.plan : undefined;
  const apply = async () => {
    if (!plan?.canApply || busyRef.current) return;
    busyRef.current = true;
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
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <M3Dialog
      open={open}
      onClose={close}
      dismissible={!busy}
      headline="Sicherung prüfen"
      presentation="fullscreen"
      leadingAction={
        <m3-icon-button aria-label="Importprüfung schließen" disabled={busy} onClick={close}>
          <IconClose />
        </m3-icon-button>
      }
      actions={
        <>
          <m3-button slot="actions" variant="text" disabled={busy} onClick={close}>
            Abbrechen
          </m3-button>
          <m3-button
            slot="actions"
            variant="filled"
            loading={busy}
            disabled={busy || !plan?.canApply}
            onClick={() => void apply()}
          >
            {busy ? "Wird importiert…" : mode === "replace" ? "Sicherung wiederherstellen" : "Sicherung zusammenführen"}
          </m3-button>
        </>
      }
    >
      <div className={styles.body}>
        <p className={styles.fileName}>{fileName}</p>
        {"error" in planned ? (
          <p className={styles.error} role="alert">{planned.error}</p>
        ) : plan ? (
          <>
            <fieldset className={styles.modeChoice} disabled={busy}>
              <legend>Importmodus</legend>
              <label className={styles.choiceRow}>
                <input type="radio" name="import-mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
                <span>
                  <strong>Zusammenführen</strong>
                  <small>Bestehende Bibliothek ergänzen</small>
                </span>
              </label>
              <label className={styles.choiceRow}>
                <input type="radio" name="import-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
                <span>
                  <strong>Ersetzen</strong>
                  <small>Bibliothek vollständig aus der Sicherung wiederherstellen</small>
                </span>
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
                <h3 id="import-conflicts-title">Konflikte auflösen</h3>
                {plan.conflicts.map((conflict) => (
                  <M3Select
                    key={conflict.id}
                    label={`${conflict.entity}: ${conflict.incomingId ?? conflict.code}`}
                    value={conflict.resolution ?? ""}
                    disabled={busy}
                    onChange={(value) => setResolutions((current) => ({
                      ...current,
                      [conflict.id]: value as ImportConflictResolution,
                    }))}
                  >
                    <option value="">Bitte entscheiden…</option>
                    {conflict.allowedResolutions.map((resolution) => (
                      <option key={resolution} value={resolution}>{RESOLUTION_LABELS[resolution]}</option>
                    ))}
                  </M3Select>
                ))}
              </section>
            ) : null}
            {plan.containsSensitiveValues ? (
              <label className={`${styles.choiceRow} ${styles.secretChoice}`}>
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
          </>
        ) : null}
      </div>
    </M3Dialog>
  );
}
