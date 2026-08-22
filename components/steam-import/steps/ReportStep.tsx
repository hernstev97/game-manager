import type { SteamImportWizardController } from "../useSteamImportWizard";
import { reportHandoffLabel } from "../wizard-labels";
import styles from "../steam-import.module.css";
import detailStyles from "../steam-import-details.module.css";

export function ReportStep({
  controller,
}: {
  controller: SteamImportWizardController;
}) {
  const report = controller.report;
  if (!report) return null;
  return (
    <div className={styles.content} aria-live="polite">
      <h3>Import abgeschlossen</h3>
      <dl className={detailStyles.planSummary}>
        <div><dt>Hinzugefügt</dt><dd>{report.added}</dd></div>
        <div><dt>Aktualisiert</dt><dd>{report.updated}</dd></div>
        <div><dt>Jobs</dt><dd>{reportHandoffLabel(report.jobsHandoff)}</dd></div>
        <div><dt>Metadaten-Review</dt><dd>{reportHandoffLabel(report.reviewHandoff)}</dd></div>
      </dl>
      {report.warnings.length ? (
        <ul className={detailStyles.reportWarnings}>
          {report.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : (
        <p className={styles.success}>
          Die ausgewählten Bibliothekswerte wurden bestätigt.
        </p>
      )}
      <button type="button" className={styles.primaryButton} onClick={controller.restart}>
        Weiteren Import starten
      </button>
    </div>
  );
}
