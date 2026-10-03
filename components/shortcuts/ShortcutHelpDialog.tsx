"use client";

import { M3Dialog } from "@/components/m3/host";
import { LIBRARY_SHORTCUTS } from "./shortcut-registry";
import styles from "./shortcuts.module.css";

export function ShortcutHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline="Tastenkürzel"
      actions={<m3-button slot="actions" onClick={onClose}>Schließen</m3-button>}
    >
      <p className={styles.intro}>Kürzel werden nicht ausgelöst, während du in einem Textfeld schreibst.</p>
      <dl className={styles.list}>
        {LIBRARY_SHORTCUTS.map((shortcut) => (
          <div className={styles.row} key={`${shortcut.keys.join("-")}-${shortcut.description}`}>
            <dt>
              {shortcut.keys.map((key) => <kbd key={key}>{key}</kbd>)}
            </dt>
            <dd>
              <strong>{shortcut.description}</strong>
              <span>{shortcut.context}</span>
            </dd>
          </div>
        ))}
      </dl>
    </M3Dialog>
  );
}
