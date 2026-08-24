"use client";

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
      <m3-card variant="outlined" className="empty-state">
        <h2 slot="header">Noch keine Spiele</h2>
        <p>Lege ein Spiel an oder importiere eine JSON-Sicherung.</p>
        <m3-button slot="actions" onClick={onAdd}>
          Spiel hinzufügen
        </m3-button>
      </m3-card>
    );
  }

  return (
    <m3-card variant="outlined" className="empty-state">
      <h2 slot="header">Keine Treffer</h2>
      <p>Kein Spiel passt zu den aktuellen Filtern.</p>
      <m3-button slot="actions" variant="text" onClick={onClearFilters}>
        Filter zurücksetzen
      </m3-button>
    </m3-card>
  );
}
