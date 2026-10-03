"use client";

import styles from "./pwa.module.css";

export function UpdatePrompt({ applyUpdate }: { applyUpdate: () => void }) {
  return (
    <aside className={styles.card} role="status">
      <div>
        <strong>Update verfügbar</strong>
        <p>Die neue Version wird erst nach deiner Bestätigung aktiviert.</p>
      </div>
      <m3-button onClick={applyUpdate}>Aktualisieren</m3-button>
    </aside>
  );
}
