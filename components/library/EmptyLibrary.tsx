"use client";

import { useRef } from "react";
import { IconAdd, IconLibrary, IconLink, IconUpload } from "@/components/m3/icons";

/** First-run state: only the three ways to fill an empty library. */
export function WelcomeLibrary({
  onAdd,
  onImport,
  onConnectSteam,
}: {
  onAdd: () => void;
  onImport: (file: File) => void;
  onConnectSteam: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <section className="welcome-library" aria-labelledby="welcome-library-title">
      <span className="welcome-library-icon" aria-hidden="true">
        <IconLibrary width={40} height={40} />
      </span>
      <h2 id="welcome-library-title">Deine Bibliothek ist noch leer</h2>
      <p>Füge dein erstes Spiel hinzu, stelle eine Sicherung wieder her oder hole deine Steam-Bibliothek.</p>
      <div className="welcome-library-actions">
        <m3-button onClick={onAdd}>
          <IconAdd slot="icon" />
          Spiel hinzufügen
        </m3-button>
        <m3-button variant="tonal" onClick={() => fileRef.current?.click()}>
          <IconUpload slot="icon" />
          Sicherung importieren
        </m3-button>
        <m3-button variant="text" onClick={onConnectSteam}>
          <IconLink slot="icon" />
          Steam verbinden
        </m3-button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = "";
        }}
      />
    </section>
  );
}

/** Shown when filters hide every game. */
export function EmptyLibrary({
  libraryEmpty,
  onAdd,
  onClearFilters,
}: {
  libraryEmpty: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}) {
  if (libraryEmpty) {
    return (
      <div className="empty-results">
        <h2>Noch keine Spiele</h2>
        <p>Lege ein Spiel an oder importiere eine JSON-Sicherung.</p>
        <m3-button onClick={onAdd}>Spiel hinzufügen</m3-button>
      </div>
    );
  }

  return (
    <div className="empty-results">
      <h2>Keine Treffer</h2>
      <p>Kein Spiel passt zu Suche und Filtern.</p>
      <m3-button variant="tonal" onClick={onClearFilters}>
        Filter zurücksetzen
      </m3-button>
    </div>
  );
}
