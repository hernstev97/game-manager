"use client";

import { IconKeyboard } from "@/components/m3/icons";
import { requestShortcutHelp } from "@/components/shortcuts";

export function HelpSettingsPanel({ hidden }: { hidden: boolean }) {
  return (
    <section id="settings-help" className="settings settings-panel" hidden={hidden}>
      <h3 className="settings-section-title">Hilfe</h3>
      <p className="settings-copy">
        gGrid speichert alles lokal in diesem Browser. Mit <kbd>/</kbd> suchst du, mit <kbd>N</kbd>{" "}
        fügst du ein Spiel hinzu und mit <kbd>?</kbd> öffnest du jederzeit die Übersicht aller Kürzel.
      </p>
      <div className="settings-actions">
        <m3-button variant="tonal" onClick={requestShortcutHelp}>
          <IconKeyboard slot="icon" />
          Tastenkürzel anzeigen
        </m3-button>
      </div>
    </section>
  );
}
