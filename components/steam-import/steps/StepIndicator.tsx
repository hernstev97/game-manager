import { STEP_LABELS, type SteamImportWizardStep } from "../wizard-labels";
import styles from "../steam-import.module.css";

export function StepIndicator({ step }: { step: SteamImportWizardStep }) {
  const currentIndex = STEP_LABELS.findIndex(([value]) => value === step);
  return (
    <ol className={styles.steps} aria-label="Importschritte">
      {STEP_LABELS.map(([id, label], index) => (
        <li
          key={id}
          aria-current={id === step ? "step" : undefined}
          data-complete={index < currentIndex || undefined}
        >
          <span>{index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
