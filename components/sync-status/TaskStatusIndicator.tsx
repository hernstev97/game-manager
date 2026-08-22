"use client";

import type { CSSProperties } from "react";
import { sanitizeDiagnosticText } from "@/lib/jobs/errors";
import type { RuntimeJob } from "@/lib/jobs/state";
import {
  defaultJobLabel,
  deriveJobStatus,
  sortJobsForDisplay,
  summarizeJobs,
} from "@/components/jobs/presenter";
import styles from "./task-status.module.css";

export type TaskStatusIndicatorProps = {
  jobs: readonly RuntimeJob[];
  isOnline: boolean;
  onOpen: () => void;
  titleForJob?: (job: RuntimeJob) => string;
  controlsId?: string;
  expanded?: boolean;
};

export function TaskStatusIndicator({
  jobs,
  isOnline,
  onOpen,
  titleForJob = defaultJobLabel,
  controlsId,
  expanded,
}: TaskStatusIndicatorProps) {
  const summary = summarizeJobs(jobs, isOnline);
  const current = sortJobsForDisplay(jobs, isOnline)[0];
  const status = current ? deriveJobStatus(current, isOnline) : null;
  const title = current ? sanitizeDiagnosticText(titleForJob(current)) : null;
  const label = summary.running > 0 && title
    ? `${title} läuft`
    : summary.offlinePaused > 0
      ? `${summary.offlinePaused} ${summary.offlinePaused === 1 ? "Aufgabe" : "Aufgaben"} offline pausiert`
      : summary.rateLimitPaused > 0
        ? `${summary.rateLimitPaused} ${summary.rateLimitPaused === 1 ? "Aufgabe wartet" : "Aufgaben warten"} auf den nächsten Versuch`
        : summary.failed > 0
          ? `${summary.failed} ${summary.failed === 1 ? "Aufgabe fehlgeschlagen" : "Aufgaben fehlgeschlagen"}`
          : summary.active > 0
            ? `${summary.active} ${summary.active === 1 ? "Aufgabe wartet" : "Aufgaben warten"}`
            : "Keine offenen Aufgaben";
  const progressStyle = summary.progress.percent === null
    ? undefined
    : ({ "--compact-progress": `${summary.progress.percent}%` } as CSSProperties);

  return (
    <button
      type="button"
      className={`${styles.indicator} ${status ? styles[`status-${status}`] : ""}`}
      onClick={onOpen}
      aria-controls={controlsId}
      aria-expanded={expanded}
      aria-label={`${label}. Aufgaben-Center öffnen.`}
    >
      <span className={styles.icon} aria-hidden="true">
        <span />
      </span>
      <span className={styles.copy} aria-live="polite" aria-atomic="true">
        <strong>Aufgaben</strong>
        <span>{label}</span>
      </span>
      {summary.progress.percent !== null && jobs.length > 0 ? (
        <span className={styles.progress} aria-hidden="true" style={progressStyle}>
          <span />
        </span>
      ) : null}
      {summary.failed > 0 ? (
        <span className={styles.badge} aria-hidden="true">{summary.failed}</span>
      ) : null}
    </button>
  );
}
