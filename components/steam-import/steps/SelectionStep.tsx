import { defaultSteamImportSelection } from "@/lib/steam-import/match";
import type { SteamImportCategory } from "@/lib/steam-import/types";
import type { SteamImportWizardController } from "../useSteamImportWizard";
import {
  CATEGORY_LABELS,
  needsResolution,
  selectedResolutionValue,
} from "../wizard-labels";
import styles from "../steam-import.module.css";
import detailStyles from "../steam-import-details.module.css";

export function SelectionStep({
  controller,
}: {
  controller: SteamImportWizardController;
}) {
  const comparison = controller.comparison;
  if (!comparison) return null;
  return (
    <div className={styles.content}>
      <dl className={detailStyles.categorySummary}>
        {Object.entries(comparison.counts).map(([category, count]) => (
          <div key={category} data-category={category}>
            <dt>{CATEGORY_LABELS[category as SteamImportCategory]}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      {controller.normalization?.issues.length ? (
        <details className={detailStyles.issues}>
          <summary>
            {controller.normalization.issues.length} Hinweise bei der Normalisierung
          </summary>
          <ul>
            {controller.normalization.issues.map((issue, index) => (
              <li key={`${issue.code}-${issue.index ?? index}`}>{issue.message}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className={detailStyles.selectionHeader}>
        <div>
          <h3>Spiele auswählen und zuordnen</h3>
          <p>
            {controller.selectedAppIds.length} von {comparison.items.length} ausgewählt
          </p>
        </div>
        <button
          type="button"
          className={styles.textButton}
          onClick={() =>
            controller.setSelectedAppIds(defaultSteamImportSelection(comparison))
          }
        >
          Sichere Auswahl wiederherstellen
        </button>
      </div>
      <ul className={detailStyles.gameList}>
        {comparison.items.map((item) => {
          const appId = item.source.steamAppId;
          const requiresChoice = needsResolution(item.category);
          return (
            <li key={appId} data-category={item.category}>
              <label className={detailStyles.gameChoice}>
                <input
                  type="checkbox"
                  checked={controller.selectedSet.has(appId)}
                  disabled={item.category === "already-current"}
                  onChange={(event) =>
                    controller.toggleSelection(appId, event.target.checked)
                  }
                />
                <span>
                  <strong>{item.source.name}</strong>
                  <small>
                    Steam {appId}
                    {item.source.playtimeMinutes !== null
                      ? ` · ${item.source.playtimeMinutes} Min.`
                      : ""}
                  </small>
                </span>
                <span className={detailStyles.categoryBadge}>
                  {CATEGORY_LABELS[item.category]}
                </span>
              </label>
              {requiresChoice ? (
                <label className={detailStyles.mappingChoice}>
                  <span>
                    {item.category === "possible-match"
                      ? "Unsicheren Namensfund zuordnen"
                      : "Konflikt auflösen"}
                  </span>
                  <select
                    value={selectedResolutionValue(
                      controller.resolutions[String(appId)],
                    )}
                    onChange={(event) =>
                      controller.setResolution(appId, event.target.value)
                    }
                  >
                    <option value="">Nicht automatisch zusammenführen</option>
                    {item.candidateGameIds.map((gameId) => (
                      <option key={gameId} value={`existing:${gameId}`}>
                        {controller.existingById.get(gameId)?.name ?? gameId} zuordnen
                      </option>
                    ))}
                    <option value="new">Als neues Spiel importieren</option>
                  </select>
                </label>
              ) : item.matchedGameId ? (
                <p className={detailStyles.matchNote}>
                  Zuordnung: {controller.existingById.get(item.matchedGameId)?.name ?? item.matchedGameId}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {controller.unresolvedSelected.length ? (
        <p className={styles.notice} role="status">
          {controller.unresolvedSelected.length} ausgewählte unsichere Treffer
          brauchen noch eine ausdrückliche Zuordnung.
        </p>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={controller.restart}>
          Neu laden
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={
            controller.selectedAppIds.length === 0 ||
            controller.unresolvedSelected.length > 0
          }
          onClick={() => controller.setStep("options")}
        >
          Optionen
        </button>
      </div>
    </div>
  );
}
