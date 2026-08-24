"use client";

import { useMemo, useReducer } from "react";
import type { StoredLibrarySnapshot } from "@/lib/persistence/snapshots";
import {
  confirmationForSnapshot,
  INITIAL_SNAPSHOT_UI_STATE,
  isSnapshotActionPending,
  nextProtectionValue,
  presentSnapshot,
  presentSnapshotError,
  snapshotUiReducer,
  sortSnapshotsForDisplay,
} from "@/lib/snapshots-ui";
import styles from "./snapshots.module.css";

export type SnapshotManagerProps = {
  snapshots: readonly StoredLibrarySnapshot[];
  loading?: boolean;
  onCreate: () => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onProtectionChange: (id: string, protectedValue: boolean) => Promise<void>;
  onReload: () => Promise<void>;
};

export function SnapshotManager({
  snapshots,
  loading = false,
  onCreate,
  onRestore,
  onDelete,
  onProtectionChange,
  onReload,
}: SnapshotManagerProps) {
  const [state, dispatch] = useReducer(snapshotUiReducer, INITIAL_SNAPSHOT_UI_STATE);
  const presented = useMemo(
    () => sortSnapshotsForDisplay(snapshots).map((snapshot) => presentSnapshot(snapshot)),
    [snapshots],
  );
  const active = state.dialog
    ? presented.find((snapshot) => snapshot.id === state.dialog?.snapshotId) ?? null
    : null;

  const run = async (
    pending: { kind: "create" | "restore" | "delete" | "protect"; snapshotId?: string },
    action: () => Promise<void>,
  ) => {
    dispatch({ type: "start", pending });
    try {
      await action();
      dispatch({ type: "succeed" });
    } catch (error) {
      dispatch({ type: "fail", error: presentSnapshotError(error) });
    }
  };

  const dialogKind = state.dialog?.kind;
  const confirmation = active && dialogKind && dialogKind !== "preview"
    ? confirmationForSnapshot(dialogKind, active)
    : null;

  return (
    <section className={styles.manager} aria-labelledby="snapshot-heading">
      <div className={styles.headingRow}>
        <div>
          <h3 id="snapshot-heading">Lokale Snapshots</h3>
          <p>Wiederherstellungspunkte bleiben nur auf diesem Gerät und enthalten keine Zugangsdaten.</p>
        </div>
        <m3-button
          variant="tonal"
          disabled={Boolean(state.pending)}
          onClick={() => void run({ kind: "create" }, onCreate)}
        >
          Snapshot erstellen
        </m3-button>
      </div>

      {state.actionError ? (
        <div className={styles.error} role="alert">
          <strong>{state.actionError.title}</strong>
          <span>{state.actionError.detail}</span>
          <span>{state.actionError.suggestion}</span>
          <div className={styles.inlineActions}>
            <m3-button variant="text" onClick={() => void onReload()}>Erneut laden</m3-button>
            <m3-button variant="text" onClick={() => dispatch({ type: "dismiss-error" })}>
              Ausblenden
            </m3-button>
          </div>
        </div>
      ) : null}

      {loading ? <p aria-live="polite">Snapshots werden geladen …</p> : null}
      {!loading && presented.length === 0 ? (
        <p className={styles.empty}>Noch keine lokalen Snapshots vorhanden.</p>
      ) : null}

      <div className={styles.list}>
        {presented.map((snapshot) => (
          <article className={styles.card} key={snapshot.id}>
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => dispatch({
                type: "open",
                dialog: { kind: "preview", snapshotId: snapshot.id },
              })}
            >
              <strong>{snapshot.createdAtLabel}</strong>
              <span>{snapshot.reasonLabel}</span>
              <span>{snapshot.gameCount} Spiele · {snapshot.viewCount} Ansichten · {snapshot.sizeLabel}</span>
            </button>
            <div className={styles.cardActions}>
              <m3-button
                variant="text"
                disabled={Boolean(state.pending)}
                onClick={() => void run(
                  { kind: "protect", snapshotId: snapshot.id },
                  () => onProtectionChange(snapshot.id, nextProtectionValue(snapshot)),
                )}
              >
                {snapshot.protected ? "Schutz lösen" : "Schützen"}
              </m3-button>
              <m3-button
                variant="text"
                disabled={Boolean(state.pending)}
                onClick={() => dispatch({
                  type: "open",
                  dialog: { kind: "restore", snapshotId: snapshot.id },
                })}
              >
                Wiederherstellen
              </m3-button>
              <m3-button
                variant="text"
                disabled={snapshot.protected || Boolean(state.pending)}
                onClick={() => dispatch({
                  type: "open",
                  dialog: { kind: "delete", snapshotId: snapshot.id },
                })}
              >
                Löschen
              </m3-button>
            </div>
          </article>
        ))}
      </div>

      {active && state.dialog ? (
        <section className={styles.detail} aria-live="polite" aria-labelledby="snapshot-detail-title">
          <h4 id="snapshot-detail-title">
            {confirmation?.title ?? `Snapshot vom ${active.createdAtLabel}`}
          </h4>
          {confirmation ? <p>{confirmation.detail}</p> : (
            <div className={styles.preview}>
              <p>{active.gameCount} Spiele, {active.viewCount} Ansichten, {active.sizeLabel}</p>
              <PreviewNames label="Spiele" names={active.gameNames} remaining={active.remainingGames} />
              <PreviewNames label="Ansichten" names={active.viewNames} remaining={active.remainingViews} />
            </div>
          )}
          <div className={styles.inlineActions}>
            <m3-button variant="text" onClick={() => dispatch({ type: "close" })}>
              Schließen
            </m3-button>
            {confirmation ? (
              <m3-button
                disabled={Boolean(state.pending)}
                className={confirmation.destructive ? "danger-button" : undefined}
                onClick={() => void run(
                  { kind: state.dialog!.kind as "restore" | "delete", snapshotId: active.id },
                  () => state.dialog!.kind === "restore"
                    ? onRestore(active.id)
                    : onDelete(active.id),
                )}
              >
                {confirmation.confirmLabel}
              </m3-button>
            ) : null}
          </div>
        </section>
      ) : null}

      <span className={styles.srOnly} aria-live="polite">
        {isSnapshotActionPending(state.pending, "create") ? "Snapshot wird erstellt" : ""}
      </span>
    </section>
  );
}

function PreviewNames({ label, names, remaining }: { label: string; names: string[]; remaining: number }) {
  return (
    <div>
      <strong>{label}</strong>
      <ul>{names.map((name) => <li key={name}>{name}</li>)}</ul>
      {remaining > 0 ? <span>und {remaining} weitere</span> : null}
    </div>
  );
}
