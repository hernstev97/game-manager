import type { SteamImportWizardController } from "../useSteamImportWizard";
import styles from "../steam-import.module.css";
import detailStyles from "../steam-import-details.module.css";

export function OptionsStep({
  controller,
}: {
  controller: SteamImportWizardController;
}) {
  return (
    <div className={styles.content}>
      <h3>Optionale Nachbereitung</h3>
      <p>
        Jobs werden nur vorbereitet. Die App führt sie später mit ihrem
        zentralen Scheduler, Offline- und Rate-Limit-Vertrag aus.
      </p>
      <fieldset className={detailStyles.jobOptions}>
        <legend>Nach dem Import vorbereiten</legend>
        <label>
          <input
            type="checkbox"
            checked={controller.jobs.details}
            onChange={(event) =>
              controller.setJobs((current) => ({
                ...current,
                details: event.target.checked,
              }))
            }
          />
          <span>
            <strong>Steam-Details</strong>
            <small>Pro ausgewähltem Spiel einen kontrollierten Detailjob.</small>
          </span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={controller.jobs.covers}
            onChange={(event) =>
              controller.setJobs((current) => ({
                ...current,
                covers: event.target.checked,
              }))
            }
          />
          <span>
            <strong>Cover prüfen</strong>
            <small>
              Cover bleiben Review-Vorschläge und werden niemals still überschrieben.
            </small>
          </span>
        </label>
      </fieldset>
      <div className={styles.actions}>
        <m3-button variant="outlined" onClick={() => controller.setStep("select")}>
          Zurück
        </m3-button>
        <m3-button variant="filled" onClick={controller.prepareReview}>
          Importplan prüfen
        </m3-button>
      </div>
    </div>
  );
}
