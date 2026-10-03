"use client";

import { sanitizeDiagnosticText } from "@/lib/jobs/errors";
import type { RuntimeJob } from "@/lib/jobs/state";
import {
  aggregateJobErrors,
  defaultJobLabel,
  deriveJobStatus,
  formatNextAttempt,
  jobStatusLabel,
  presentJobProgress,
  sortJobsForDisplay,
  summarizeJobs,
  type EffectiveJobStatus,
  type PresentedJobProgress,
} from "./presenter";
import styles from "./jobs.module.css";
import { IconClose } from "@/components/m3/icons";

export type TaskCenterProps = {
  jobs: readonly RuntimeJob[];
  isOnline: boolean;
  now?: number;
  locale?: string;
  titleForJob?: (job: RuntimeJob) => string;
  onCancel?: (jobId: string) => void | Promise<void>;
  onRetry?: (jobId: string) => void | Promise<void>;
  /** Rendered inside a dialog that already owns the headline and close action. */
  embedded?: boolean;
  onClose?: () => void;
  pendingActionJobIds?: readonly string[];
  heading?: string;
};

function ProgressBar({ progress, label }: { progress: PresentedJobProgress; label: string }) {
  const accessibleMaximum = progress.total === 0 ? 1 : progress.total;
  const accessibleValue = progress.total === 0 ? 1 : progress.completed;
  const style = progress.percent === null
    ? undefined
    : ({ "--task-progress": `${progress.percent}%` } as React.CSSProperties);
  return (
    <div
      className={`${styles.progressTrack} ${progress.percent === null ? styles.indeterminate : ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={accessibleMaximum ?? undefined}
      aria-valuenow={progress.total === null ? undefined : accessibleValue}
      aria-valuetext={progress.percent === null ? "Fortschritt unbekannt" : `${progress.percent} Prozent`}
      style={style}
    >
      <span className={styles.progressFill} />
    </div>
  );
}

function statusExplanation(status: EffectiveJobStatus): string {
  const explanations: Record<EffectiveJobStatus, string> = {
    running: "Die App verarbeitet diese Aufgabe gerade.",
    queued: "Die Aufgabe wartet auf einen freien Ausführungsplatz.",
    offline: "Ohne Verbindung ist die Aufgabe pausiert. Sie kann online fortgesetzt werden.",
    "rate-limit": "Der Onlinedienst begrenzt Anfragen. Die Aufgabe wartet automatisch.",
    "user-paused": "Die Aufgabe wurde angehalten.",
    interrupted: "Die App war geschlossen. Die Aufgabe kann beim nächsten Start fortgesetzt werden.",
    succeeded: "Die Aufgabe wurde vollständig abgeschlossen.",
    failed: "Die Aufgabe konnte nicht abgeschlossen werden.",
    cancelled: "Die Aufgabe wurde abgebrochen.",
  };
  return explanations[status];
}

function formatOccurredAt(value: string, locale: string): string | null {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function TaskCard({
  job,
  isOnline,
  now,
  locale,
  title,
  featured,
  pending,
  onCancel,
  onRetry,
}: {
  job: RuntimeJob;
  isOnline: boolean;
  now?: number;
  locale: string;
  title: string;
  featured: boolean;
  pending: boolean;
  onCancel?: (jobId: string) => void | Promise<void>;
  onRetry?: (jobId: string) => void | Promise<void>;
}) {
  const status = deriveJobStatus(job, isOnline);
  const progress = presentJobProgress(job);
  const errors = aggregateJobErrors(job.errors);
  const errorCount = errors.reduce((total, error) => total + error.count, 0);
  const nextAttempt = formatNextAttempt(job, now, locale);
  const canCancel = !["succeeded", "cancelled", "failed"].includes(job.state);
  const canRetry = job.state === "failed";
  const message = job.progress?.message
    ? sanitizeDiagnosticText(job.progress.message)
    : null;

  return (
    <article className={`${styles.jobCard} ${featured ? styles.featured : ""}`}>
      <header className={styles.jobHeader}>
        <div className={styles.jobHeading}>
          <h3>{title}</h3>
          <span className={`${styles.statusChip} ${styles[`status-${status}`]}`}>
            {jobStatusLabel(status)}
          </span>
        </div>
        <p>{statusExplanation(status)}</p>
      </header>

      {job.progress ? (
        <div className={styles.jobProgress}>
          <div className={styles.progressLabel}>
            <span>Fortschritt</span>
            <strong>{progress.percent === null ? "Offen" : `${progress.percent} %`}</strong>
          </div>
          <ProgressBar progress={progress} label={`Fortschritt für ${title}`} />
          <dl className={styles.metrics}>
            <div><dt>Verarbeitet</dt><dd>{progress.processed}</dd></div>
            <div><dt>Verbleibend</dt><dd>{progress.remaining}</dd></div>
            <div><dt>Fehlgeschlagen</dt><dd>{progress.failed}</dd></div>
          </dl>
          {message ? <p className={styles.progressMessage}>{message}</p> : null}
        </div>
      ) : (
        <p className={styles.noProgress}>Für diese Aufgabe liegen noch keine Fortschrittszahlen vor.</p>
      )}

      {nextAttempt && (job.pauseReason === "rate-limit" || job.nextAttemptAt) ? (
        <p className={styles.retryTime}>
          Nächster Versuch: <time dateTime={nextAttempt.dateTime}>{nextAttempt.label}</time>
          {job.retryAfterSeconds ? ` · Retry-After: ${job.retryAfterSeconds} s` : ""}
        </p>
      ) : null}

      {errors.length > 0 ? (
        <details className={styles.errorDetails}>
          <summary>
            Fehlerdetails · {errorCount} {errorCount === 1 ? "Vorkommnis" : "Vorkommnisse"}, {errors.length} {errors.length === 1 ? "Art" : "Arten"}
          </summary>
          <ul>
            {errors.map((error) => {
              const occurredAt = formatOccurredAt(error.lastOccurredAt, locale);
              return (
                <li key={error.code}>
                  <div className={styles.errorHeader}>
                    <code>{error.code}</code>
                    <span>{error.count}×</span>
                  </div>
                  <p>{error.message}</p>
                  <small>
                    {error.retryable ? "Erneuter Versuch möglich" : "Nicht automatisch wiederholbar"}
                    {occurredAt ? ` · zuletzt ${occurredAt}` : ""}
                  </small>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      {(canCancel && onCancel) || (canRetry && onRetry) ? (
        <div className={styles.jobActions}>
          {canRetry && onRetry ? (
            <m3-button disabled={pending} onClick={() => void onRetry(job.id)}>
              {pending ? "Wird vorbereitet …" : "Wiederholen"}
            </m3-button>
          ) : null}
          {canCancel && onCancel ? (
            <m3-button variant="text" disabled={pending} onClick={() => void onCancel(job.id)}>
              {pending ? "Wird abgebrochen …" : "Abbrechen"}
            </m3-button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function TaskCenter({
  jobs,
  isOnline,
  now,
  locale = "de-DE",
  titleForJob = defaultJobLabel,
  onCancel,
  onRetry,
  onClose,
  pendingActionJobIds = [],
  heading = "Aufgaben-Center",
  embedded = false,
}: TaskCenterProps) {
  const sorted = sortJobsForDisplay(jobs, isOnline);
  const summary = summarizeJobs(jobs, isOnline);
  const pendingIds = new Set(pendingActionJobIds);
  const liveSummary = summary.running > 0
    ? `${summary.running} Aufgaben laufen.`
    : summary.offlinePaused > 0
      ? `${summary.offlinePaused} Aufgaben sind offline pausiert.`
      : summary.rateLimitPaused > 0
        ? `${summary.rateLimitPaused} Aufgaben warten wegen eines Rate-Limits.`
        : summary.failed > 0
          ? `${summary.failed} Aufgaben sind fehlgeschlagen.`
          : summary.active > 0
            ? `${summary.active} Aufgaben warten.`
            : "Keine offenen Aufgaben.";

  return (
    <section className={styles.center} aria-labelledby="task-center-heading">
      <header className={embedded ? "visually-hidden" : styles.centerHeader}>
        <div>
          <p className={styles.eyebrow}>Lokale Aufgabenverwaltung</p>
          <h2 id="task-center-heading">{heading}</h2>
        </div>
        {onClose && !embedded ? (
          <m3-icon-button aria-label="Aufgaben-Center schließen" onClick={onClose}>
            <IconClose />
          </m3-icon-button>
        ) : null}
      </header>

      <p className={styles.sessionNotice}>
        Aufgaben laufen nur, solange GGrid geöffnet ist. Beim Schließen werden sie sicher unterbrochen und können beim nächsten Start fortgesetzt werden.
      </p>
      {!isOnline ? (
        <p className={styles.offlineNotice} role="status">
          Offline: Aufgaben mit Onlinediensten sind pausiert. Lokale Bibliotheksdaten bleiben verfügbar.
        </p>
      ) : null}

      <p className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
        {liveSummary}
      </p>

      {jobs.length > 0 ? (
        <section className={styles.overall} aria-labelledby="overall-progress-heading">
          <div className={styles.progressLabel}>
            <h3 id="overall-progress-heading">Gesamtfortschritt</h3>
            <strong>{summary.progress.percent === null ? "Offen" : `${summary.progress.percent} %`}</strong>
          </div>
          <ProgressBar progress={summary.progress} label="Gesamtfortschritt aller angezeigten Aufgaben" />
          <dl className={styles.metrics}>
            <div><dt>Verarbeitet</dt><dd>{summary.progress.processed}</dd></div>
            <div><dt>Verbleibend</dt><dd>{summary.progress.remaining}</dd></div>
            <div><dt>Fehlgeschlagen</dt><dd>{summary.progress.failed}</dd></div>
          </dl>
        </section>
      ) : null}

      <div className={styles.jobList}>
        {sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Keine Aufgaben vorhanden</h3>
            <p>Vorbereitete und laufende Aufgaben erscheinen hier.</p>
          </div>
        ) : sorted.map((job, index) => (
          <TaskCard
            key={job.id}
            job={job}
            isOnline={isOnline}
            now={now}
            locale={locale}
            title={sanitizeDiagnosticText(titleForJob(job))}
            featured={index === 0 && summary.active > 0}
            pending={pendingIds.has(job.id)}
            onCancel={onCancel}
            onRetry={onRetry}
          />
        ))}
      </div>
    </section>
  );
}
