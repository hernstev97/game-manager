# Mobile Schnellbearbeitung (zurückgestellt)

## Ziel

Auf Mobilgeräten sollen häufige Änderungen möglich sein, ohne den vollständigen Spiele-Editor
zu öffnen. Die Funktion ist ausdrücklich nicht Teil des aktuellen Entwicklungs-Sweeps.

## Vorgesehener Einstieg

- Langer Druck auf eine Spielkarte oder Listenzeile.
- Gleichwertige, sichtbare Kontextmenü-Aktion für Tastatur, Screenreader und Geräte ohne
  zuverlässige Long-Press-Erkennung.
- Keine exklusive Swipe-Geste. Falls später Swipe-Aktionen ergänzt werden, müssen dieselben
  Aktionen weiterhin über das Kontextmenü erreichbar sein.

## Oberfläche

Ein adaptives Bottom Sheet zeigt Spielname und Cover sowie ausschließlich diese Schnellfelder:

- Status
- Besitz
- Wunschliste
- Bewertung
- Warteschlange (hinzufügen, entfernen oder Position auswählen)
- kurze Notiz

Das Sheet übernimmt bestehende Fokus-, Escape-, Reduced-Motion- und Dialogregeln. Es darf die
normale Zeilenaktion und den Mehrfachauswahlmodus nicht versehentlich auslösen.

## Daten- und Undo-Vertrag

- Änderungen werden als eine atomare Transaktion gespeichert.
- Queue-Positionen werden nach jeder Änderung eindeutig und lückenlos normalisiert.
- Bewertung, persönlicher Rang und Warteschlange bleiben unabhängige Felder.
- Nach dem Speichern bietet die gemeinsame Snackbar „Rückgängig“ an.
- Fehler beim lokalen Speichern lassen das Sheet offen und zeigen den gemeinsamen
  Autosave-/Speicherstatus.

## Nicht Bestandteil des Backlog-Eintrags

- Keine Implementierung von Long-Press, Swipe oder Bottom Sheet in diesem Sweep.
- Keine neue mobile-only Persistenzlogik.
- Keine konfliktbehaftete Geste ohne alternative Bedienung.
