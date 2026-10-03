import type { JobProgress } from "@/lib/model";
import type { SteamImportWizardController } from "../useSteamImportWizard";
import styles from "../steam-import.module.css";
import detailStyles from "../steam-import-details.module.css";

export function ReviewStep({
  controller,
  jobProgress,
}: {
  controller: SteamImportWizardController;
  jobProgress?: JobProgress;
}) {
  const plan = controller.plan;
  if (!plan) return null;
  const unresolved = plan.conflicts.some((conflict) => !conflict.resolution);
  return (
    <div className={styles.content}>
      <h3>Atomare Übernahme prüfen</h3>
      <dl className={detailStyles.planSummary}>
        <div><dt>Neue Spiele</dt><dd>{plan.operations.filter((item) => item.kind === "add").length}</dd></div>
        <div><dt>Aktualisierungen</dt><dd>{plan.operations.filter((item) => item.kind === "update").length}</dd></div>
        <div><dt>Vorbereitete Jobs</dt><dd>{plan.jobs.length}</dd></div>
        <div><dt>Review-Vorschläge</dt><dd>{plan.reviewHandoff.preview.metadata.length}</dd></div>
      </dl>
      <p className={styles.snapshotNote}>
        Der Plan verlangt vor dem einzelnen Dokument-Write einen
        Sicherheits-Snapshot. Zugangsdaten sind nicht enthalten.
      </p>
      {unresolved ? (
        <p className={styles.error} role="alert">
          Mindestens eine Zuordnung verletzt weiterhin eine eindeutige externe
          Identität. Bitte zurückgehen und den Eintrag abwählen oder anders zuordnen.
        </p>
      ) : null}
      {jobProgress ? (
        <div className={detailStyles.jobProgress} aria-live="polite">
          <span>{jobProgress.message ?? "Vorbereitete Jobs"}</span>
          <progress
            max={jobProgress.total ?? undefined}
            value={jobProgress.total === null ? undefined : jobProgress.processed}
          />
          <small>
            {jobProgress.processed} verarbeitet · {jobProgress.remaining} offen · {jobProgress.failed} fehlgeschlagen
          </small>
        </div>
      ) : null}
      <div className={styles.actions}>
        <m3-button
          variant="outlined"
          disabled={controller.applying}
          onClick={() => {
            controller.setPlan(null);
            controller.setStep("options");
          }}
        >
          Zurück
        </m3-button>
        <m3-button
          variant="filled"
          loading={controller.applying}
          disabled={!plan.canApply || controller.applying}
          onClick={() => void controller.apply()}
        >
          {controller.applying ? "Wird atomar übernommen…" : "Import übernehmen"}
        </m3-button>
      </div>
    </div>
  );
}
