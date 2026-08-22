"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { IconDownload, IconUpload } from "@/components/m3/icons";

export function DataSettingsPanel({
  hidden,
  onClearLibrary,
  onImport,
  onExport,
}: {
  hidden: boolean;
  onClearLibrary: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
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
      <div className="settings-data-actions">
        <m3-button variant="outlined" onClick={() => importRef.current?.click()}>
          <IconUpload slot="icon" />
          Sicherung importieren
        </m3-button>
        <m3-button variant="outlined" onClick={onExport}>
          <IconDownload slot="icon" />
          Sicherung exportieren
        </m3-button>
      </div>
      <m3-divider />
      {confirmReset ? (
        <div className="confirm-row">
          <span>Alle Spiele in der Bibliothek löschen?</span>
          <m3-button
            className="danger-button"
            onClick={() => {
              onClearLibrary();
              setConfirmReset(false);
              toast.success("Bibliothek geleert.");
            }}
          >
            Löschen
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
