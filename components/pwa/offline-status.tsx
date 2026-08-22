"use client";

import type { ReactNode } from "react";
import { useOnlineStatus } from "./use-online-status";
import styles from "./pwa.module.css";

export function OfflineStatus() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className={styles.offlineBanner} role="status">
      Offline – lokale Bibliotheksdaten bleiben verfügbar. Online-Dienste warten auf eine Verbindung.
    </div>
  );
}

export function OfflineActionNotice({
  children = "Diese Aktion benötigt eine Internetverbindung.",
}: {
  children?: ReactNode;
}) {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <p className={styles.actionNotice} role="status">
      {children}
    </p>
  );
}
