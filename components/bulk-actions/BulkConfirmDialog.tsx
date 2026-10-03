"use client";

import { M3Dialog } from "@/components/m3/host";

export function BulkConfirmDialog({
  open,
  selectedCount,
  title = "Ausgewählte Spiele löschen?",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  selectedCount: number;
  title?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <M3Dialog
      open={open}
      onClose={onCancel}
      headline={title}
      actions={
        <>
          <m3-button slot="actions" variant="text" onClick={onCancel}>
            Abbrechen
          </m3-button>
          <m3-button slot="actions" className="danger-button" onClick={onConfirm}>
            {selectedCount === 1 ? "Spiel löschen" : `${selectedCount} Spiele löschen`}
          </m3-button>
        </>
      }
    >
      <p>
        {selectedCount === 1
          ? "Ein Spiel wird aus der Bibliothek entfernt."
          : `${selectedCount} Spiele werden aus der Bibliothek entfernt.`}
      </p>
      <p>Die Aktion wird erst nach dieser Bestätigung ausgeführt und kann über den Verlauf rückgängig gemacht werden.</p>
    </M3Dialog>
  );
}
