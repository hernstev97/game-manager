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
- **Steam:** ID + Web-API-Schlüssel in den Einstellungen. Cover und Spielzeit gehen über den kleinen Proxy `app/api/steam`.

`npm test` prüft Filter, Sortierung, Import-Merge und das Theme-Engine.
