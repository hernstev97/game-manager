"use client";

import type { SteamImportWizardProps } from "@/lib/steam-import/types";
import { LoadStep } from "./steps/LoadStep";
import { OptionsStep } from "./steps/OptionsStep";
import { ReportStep } from "./steps/ReportStep";
import { ReviewStep } from "./steps/ReviewStep";
import { SelectionStep } from "./steps/SelectionStep";
import { StepIndicator } from "./steps/StepIndicator";
import { useSteamImportWizard } from "./useSteamImportWizard";
import styles from "./steam-import.module.css";

export function SteamImportWizard(props: SteamImportWizardProps) {
  const controller = useSteamImportWizard(props);
  const online = props.online ?? true;
  return (
    <section
      className={[styles.wizard, props.className].filter(Boolean).join(" ")}
      aria-labelledby="steam-import-title"
    >
      <header className={styles.header}>
        <div>
          <h2 id="steam-import-title" className="visually-hidden">Steam-Bibliothek importieren</h2>
          <p>
            App-IDs werden eindeutig abgeglichen. Namensähnlichkeiten brauchen
            immer deine ausdrückliche Zuordnung.
          </p>
        </div>
      </header>
      <StepIndicator step={controller.step} />
      {!online ? (
        <p className={styles.notice} role="status">
          Offline – der Import wartet auf eine Verbindung. Bereits geladene
          Daten werden nicht im Hintergrund weiterverarbeitet.
        </p>
      ) : null}
      {controller.error ? (
        <p className={styles.error} role="alert">{controller.error}</p>
      ) : null}
      {controller.step === "load" ? (
        <LoadStep online={online} controller={controller} />
      ) : null}
      {controller.step === "select" && controller.comparison ? (
        <SelectionStep controller={controller} />
      ) : null}
      {controller.step === "options" ? (
        <OptionsStep controller={controller} />
      ) : null}
      {controller.step === "review" && controller.plan ? (
        <ReviewStep controller={controller} jobProgress={props.jobProgress} />
      ) : null}
      {controller.step === "report" && controller.report ? (
        <ReportStep controller={controller} />
      ) : null}
    </section>
  );
}
