# Bekannte Einschränkungen

Stand: 22. August 2026

- gGrid bleibt vollständig lokal. Es gibt keine Konten, Cloud-Synchronisierung oder geräteübergreifende Konfliktauflösung.
- Metadaten-Aufgaben werden persistent vorbereitet, laufen aber nur, solange die App geöffnet ist. Nach einem Neustart können unterbrochene Aufgaben fortgesetzt werden.
- Steam- und IGDB-Zugangsdaten liegen ausschließlich im lokalen Browser-Speicher. Standard-Backups enthalten sie nicht; ihr optionaler Export verlangt eine ausdrückliche Warnbestätigung.
- Offline bleiben Bibliothek, Ansichten, Ranking, Warteschlange und Snapshots nutzbar. Neue Steam-/IGDB-Daten, Preise und noch nicht gecachte Remote-Bilder benötigen eine Verbindung.
- Remote-Cover werden nur von erlaubten Bildhosts, mit erfolgreicher CORS-Antwort und innerhalb des Größenlimits gecacht. Browser- oder CDN-Schutz kann einzelne Bilder trotzdem blockieren; Platzhalter und erneute Prüfung bleiben verfügbar.
- Der GET-Share-Target ist von der Unterstützung des installierenden Browsers und Betriebssystems abhängig. Nicht erkannte Links werden als allgemeiner Add-Flow geöffnet.
- Lokale Bilddatei-Uploads sind bewusst nicht enthalten, solange kein vollständig exportierbares Assetformat existiert.
- Mobile Schnellbearbeitung ist nur als Backlog-Spezifikation dokumentiert; es gibt in diesem Sweep keine Swipe-Gesten oder Quick-Edit-Sheets.
- Ein vollständiger Accessibility-Audit bleibt außerhalb des Sweeps. Die neuen Kernflüsse besitzen Tastatur-, Fokus-, Live-Region- und Reduced-Motion-Unterstützung, ersetzen aber keinen Gesamtaudit.
