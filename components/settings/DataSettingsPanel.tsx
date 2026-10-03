"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { IconDownload, IconUpload } from "@/components/m3/icons";
import { LibrarySnapshotManager } from "@/components/library/LibrarySnapshotManager";
import { UndoButton } from "@/components/undo";

export function DataSettingsPanel({
  hidden,
  onClearLibrary,
  onImport,
  onExport,
}: {
  hidden: boolean;
  onClearLibrary: () => Promise<void>;
  onImport: (file: File) => void;
  onExport: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [clearing, setClearing] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  return (
    <section id="settings-data" className="settings settings-panel" hidden={hidden}>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = "";
        }}
      />
      <h3 className="settings-section-title">Sicherung</h3>
      <p className="settings-copy">
        Deine Bibliothek liegt nur in diesem Browser. Exportiere regelmäßig eine JSON-Sicherung.
      </p>
      <div className="settings-data-actions">
        <m3-button variant="tonal" onClick={onExport}>
          <IconDownload slot="icon" />
          Sicherung exportieren
        </m3-button>
        <m3-button variant="outlined" onClick={() => importRef.current?.click()}>
          <IconUpload slot="icon" />
          Sicherung importieren
        </m3-button>
        <UndoButton />
      </div>
      <details className="settings-disclosure">
        <summary>Lokale Snapshots</summary>
        <div className="settings-disclosure-body">
          <LibrarySnapshotManager />
        </div>
      </details>
      <h3 className="settings-section-title is-danger">Bibliothek leeren</h3>
      {confirmReset ? (
        <div className="confirm-row">
          <span>Alle Spiele in der Bibliothek löschen?</span>
          <m3-button
            className="danger-button"
            disabled={clearing}
            onClick={() => {
              setClearing(true);
              void onClearLibrary()
                .then(() => setConfirmReset(false))
                .catch((error: unknown) => {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Bibliothek konnte nicht geleert werden.",
                  );
                })
                .finally(() => setClearing(false));
            }}
          >
            {clearing ? "Sicherheitssnapshot wird erstellt …" : "Löschen"}
          </m3-button>
          <m3-button variant="text" onClick={() => setConfirmReset(false)}>
            Abbrechen
          </m3-button>
        </div>
      ) : (
        <m3-button className="danger-button" variant="outlined" onClick={() => setConfirmReset(true)}>
          Bibliothek leeren
        </m3-button>
      )}
    </section>
  );
}
