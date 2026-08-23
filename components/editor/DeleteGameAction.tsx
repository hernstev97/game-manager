"use client";

import { useState } from "react";

export function DeleteGameAction({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <>
        <span slot="actions">Dieses Spiel wirklich löschen?</span>
        <m3-button slot="actions" className="danger-button" onClick={onDelete}>
          Löschen
        </m3-button>
        <m3-button slot="actions" variant="text" onClick={() => setConfirming(false)}>
          Abbrechen
        </m3-button>
      </>
    );
  }
  return (
    <m3-button slot="actions" className="danger-button" variant="text" onClick={() => setConfirming(true)}>
      Spiel löschen
    </m3-button>
  );
}

export const DeleteFooter = DeleteGameAction;
