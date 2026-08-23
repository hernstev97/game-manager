"use client";

import { InstallPrompt } from "./install-prompt";
import { OfflineStatus } from "./offline-status";
import { UpdatePrompt } from "./update-prompt";
import { useServiceWorker } from "./use-service-worker";
import { useShareTarget } from "./use-share-target";
import { usePwaShortcut } from "./use-shortcut";
import type { PwaShareHandler } from "./share-target";
import type { PwaShortcutHandler } from "./shortcut";
import styles from "./pwa.module.css";

export function PwaShell({
  onShareTarget,
  onShortcut,
}: {
  onShareTarget?: PwaShareHandler;
  onShortcut?: PwaShortcutHandler;
}) {
  const worker = useServiceWorker();
  useShareTarget(onShareTarget);
  usePwaShortcut(onShortcut);

  return (
    <>
      <OfflineStatus />
      <div className={styles.promptStack}>
        {worker.updateAvailable ? <UpdatePrompt applyUpdate={worker.applyUpdate} /> : null}
        <InstallPrompt />
        {worker.error ? (
          <p className={styles.workerError} role="status">
            {worker.error}
          </p>
        ) : null}
      </div>
    </>
  );
}
