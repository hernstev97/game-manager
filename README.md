# gGrid

Game. Manage. Learn.

Persönliche Bibliothek für gekaufte, gewünschte und gespielte Spiele. Alles bleibt lokal (`localStorage` + JSON-Export). Kein Login, keine Datenbank. Installierbar als PWA.

```bash
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

## Bedienung

Die Oberfläche zeigt zuerst nur das Nötigste und blendet den Rest bei Bedarf ein (Progressive Disclosure):

- **Navigation:** *Bibliothek*, *Als Nächstes* (Spielwarteschlange) und *Ranking* (persönliche Favoriten). Auf Desktop/Tablet als Navigation Rail mit Hinzufügen-Button, auf dem Handy als Navigation Bar mit FAB.
- **Bibliothek:** Suche oben; das Filter-Symbol in der Suche öffnet alle Filter. Gespeicherte Ansichten liegen als Chips darunter. Ein Tipp auf die aktive Ansicht öffnet ihre Verwaltung (umbenennen, duplizieren, Standard, löschen). Geänderte Ansichten lassen sich direkt aktualisieren oder neu speichern.
- **Ergebniszeile:** Anzahl, Sortierung, Darstellung (Liste, Kompakt, Cover-Raster, Franchise-Gruppen) und Mehrfachauswahl.
- **Editor:** Status, Bewertung und Planung stehen oben. *Fortschritt* und *Quellen & Details* (Steam, IGDB, Cover-URL) sind eingeklappt.
- **Einstellungen:** Verbindungen (Steam, IGDB), Erscheinungsbild (Material You), Daten & Sicherung (Export, Import, Snapshots) und Hilfe.
- **Tastatur:** `/` Suche, `N` Spiel hinzufügen, `Q` Als Nächstes, `F6` Auswahl, `?` alle Kürzel.

## Entwicklung

- **Neues Attribut:** nur `lib/game-fields.ts` erweitern. Filter, Editor, Sortierung und Defaults ziehen automatisch nach.
- **Design-System:** Material 3 Expressive. Farben kommen dynamisch aus `lib/theme.ts` (Material You). Shape-, Typo-, Abstands-, Elevation- und Motion-Tokens liegen in `styles/tokens.css`; Komponenten verwenden ausschließlich diese Tokens.
- **Steam:** ID + Web-API-Schlüssel in den Einstellungen. Cover, Preis und Spielzeit gehen über den kleinen Proxy `app/api/steam`.
- **IGDB:** Twitch-Client-ID + Secret in den Einstellungen. Allgemeiner Katalog (Cover, Genre, Franchise, Plattformen) für Steam, Switch, Switch 2, PlayStation, Retro und den Rest, über `app/api/igdb`. Kein Auto-Import von Konsolen-Bibliotheken.

`npm test` prüft Filter, Sortierung, Import-Merge und die Theme-Engine. `npm run test:e2e` baut die App und prüft die Kernflüsse in Playwright.
