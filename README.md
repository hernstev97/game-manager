# gGrid

Game. Manage. Learn.

Persönliche Desktop-Bibliothek für gekaufte, gewünschte und gespielte Spiele. Alles bleibt lokal (`localStorage` + JSON-Export). Kein Login, keine Datenbank.

```bash
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

- **Neues Attribut:** nur `lib/game-fields.ts` erweitern. Filter, Editor, Sortierung und Defaults ziehen automatisch nach.
- **Sicherung:** Import / Export im Toolbar als `game-library.json`.
- **Steam:** ID + Web-API-Schlüssel in den Einstellungen. Cover, Preis und Spielzeit gehen über den kleinen Proxy `app/api/steam`.
- **IGDB:** Twitch-Client-ID + Secret in den Einstellungen. Allgemeiner Katalog (Cover, Genre, Franchise, Plattformen) für Steam, Switch, Switch 2, PlayStation, Retro und den Rest, über `app/api/igdb`. Kein Auto-Import von Konsolen-Bibliotheken.

`npm test` prüft Filter, Sortierung, Import-Merge und das Theme-Engine.
