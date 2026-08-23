import type { SteamImportWizardController } from "../useSteamImportWizard";
import styles from "../steam-import.module.css";

export function LoadStep({
  online,
  controller,
}: {
  online: boolean;
  controller: SteamImportWizardController;
}) {
  return (
    <div className={styles.centeredPanel}>
      <h3>Steam-Bibliothek laden</h3>
      <p>
        Zugangsdaten bleiben außerhalb dieses Assistenten. Der konfigurierte
        Loader liefert nur öffentlich benötigte Spieldaten.
      </p>
      <button
        type="button"
        className={styles.primaryButton}
        disabled={!online || controller.loading}
        onClick={() => void controller.load()}
      >
        {controller.loading ? "Bibliothek wird geladen…" : "Bibliothek laden"}
      </button>
      {controller.loading ? (
        <progress
          className={styles.progress}
          aria-label="Steam-Bibliothek wird geladen"
        />
      ) : null}
    </div>
  );
}
