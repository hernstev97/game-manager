# Library Document v2 — verbindliche Entscheidungsspezifikation

Status: angenommen für F1/F3/F4–F9. Diese Spezifikation definiert Daten- und
Transaktionsverträge, implementiert aber weder Migration noch Features. Die
öffentlichen TypeScript-Verträge liegen in `lib/model/index.ts`.

## 1. Zustandsgrenzen

| Bereich | Inhalt | Backup |
| --- | --- | --- |
| Kanonisches `LibraryDocumentV2` | Games, Views, Default-View, Franchise-Darstellung, Theme, Motion, globale Display-/Gruppierungseinstellung, registrierte lokale UI-Präferenzen und nicht geheime Integrations-IDs | vollständig |
| Lokaler Credential-Sidecar | Steam API Key, IGDB Client Secret | standardmäßig nein; nur explizit mit Warnbestätigung |
| Session-only Store | Hydration, ausgewähltes Game/View, offene Dialoge, Editor-/Import-Drafts, Dirty-Baseline, laufende Jobs, Undo-Stack | nein |
| IndexedDB-Nebenpersistenz | vollständige Snapshots und persistierbare Job-Deskriptoren | nein |

`LibraryDocumentV2` ist die portable Quelle der Wahrheit. Bestehende separate
Theme-/Motion-Keys dürfen in F1 noch als Migrationsquelle und Cache dienen, sind
danach aber nicht normativ. `localUi` nimmt nur ausdrücklich registrierte,
stabile Cross-Session-Einstellungen auf; Auswahl, Panelbreiten ohne
Produktvertrag, Dialogzustände und Drafts gehören nicht hinein.

## 2. Dokument und Kompatibilität

Das Dokument hat `format: "ggrid-library"`, `version: 2` und die in
`LibraryDocumentV2` definierten Pflichtfelder. Zeitstempel sind gültige
ISO-8601-Zeitpunkte. Ein Standardbackup ist das Dokument selbst. Secrets stehen
niemals darin, sondern nur in einem optionalen `sensitive`-Envelope eines
`LibraryBackupV2`.

Parser müssen folgende Eingaben lesen:

- ein altes nacktes Game-Array,
- ein v1-Dokument,
- ein v2-Dokument.

Alle persistierten Objektschemas werden in Zod mit `.passthrough()` gebaut.
Bekannte Felder werden validiert und normalisiert; unbekannte Schlüssel werden
auf Root-, Entity- und verschachtelten Objektebenen erhalten. Ein einzelnes
fehlerhaftes Feld darf nicht per `.catch()` ein ansonsten gültiges Objekt durch
Defaults ersetzen. Unbekannte Union-Varianten werden opak erhalten. Eine
Version größer als die höchste unterstützte Version darf angezeigt/exportiert,
aber nicht still normalisiert oder zurückgeschrieben werden.

## 3. Games und Migration von v1

`coverUrl` bleibt unverändert das bestehende Landscape-/Header-Cover. `rating`,
`queuePosition` und `favoriteRank` sind drei unabhängige Werte. F1 migriert jedes
v1-Game additiv wie folgt:

1. `rating` wird unverändert übernommen.
2. Ein gültiger alter `priority`-Wert wird Kandidat für `queuePosition`.
3. `favoriteRank` wird `null`; es gibt keine Ableitung aus Rating oder Priority.
4. `landscapeArtwork` und `caseArtwork` werden `null`; `coverUrl` wird weder
   verschoben noch umgeschrieben.
5. Bekannte v1-Werte ohne sicher ableitbare Quelle erhalten bei Bedarf
   Provenienz `migration` mit `sourceRef: "library-v1"`.
6. Der kanonische v2-Writer emittiert `priority` nicht mehr. Ein unbekannter
   Legacy-Schlüssel darf zur verlustfreien Durchleitung opak erhalten bleiben,
   ist aber fachlich wirkungslos.

Auch gespeicherte Sortierung/Filter werden migriert: `by: "priority"` wird
`by: "queuePosition"`; der Filter-Key `priority` wird `queuePosition` und die
bekannten Modi werden in `kind: "queue"` übernommen.

Der bestehende `GameRecord` bleibt in dieser Grundlagenänderung unverändert.
F1 ergänzt zuerst die Felder im Registry-/Normalisierungspfad und kann dafür
`TransitionalLibraryGameRecordV2` verwenden. Nach der Migration ist
`LibraryGameRecordV2` die kanonische Persistenzform; Feature-Code darf nicht den
Legacy-Key `priority` als Queue lesen.

### Positionsnormalisierung

Für `queuePosition` und `favoriteRank` gilt derselbe Vertrag getrennt:

- `null` bedeutet Nichtmitgliedschaft; Mitglieder haben eindeutige, lückenlose,
  positive Ganzzahlen `1..n`.
- Als Eingabekandidat gilt nur eine endliche Zahl größer null. Alle anderen
  Werte werden `null`.
- Kandidaten werden nach numerischem Eingabewert, dann ursprünglicher
  Dokumentreihenfolge, dann Game-ID sortiert und anschließend mit `1..n`
  nummeriert. Damit sind Duplikate, Dezimalwerte und Lücken deterministisch.
- Einfügen, Entfernen, Reorder, Merge und Replace normalisieren alle betroffenen
  Positionen in derselben atomaren Transaktion. Die Normalisierung eines Feldes
  verändert das andere Feld und `rating` nie.

## 4. Remote-Medien und Franchise-Darstellung

`landscapeArtwork` ist die additive Metadaten-/Auswahl-Bridge für das vorhandene
Landscape-Cover; `caseArtwork` ist das Portrait-/Case-Artwork. `coverUrl` bleibt
für Kompatibilität und Darstellung unverändert erhalten. Ist
`landscapeArtwork` gesetzt, muss dessen `url` gleich `coverUrl` sein. Eine
bestätigte neue Landscape-Auswahl setzt beides atomar. Ein migriertes
`coverUrl` ohne belastbare Herkunft bleibt erhalten und hat zunächst
`landscapeArtwork: null`.

Neue `RemoteImageAsset`s akzeptieren nur absolute `http:`- oder `https:`-URLs.
`blob:`, `data:`, lokale Pfade und gerätegebundene Handles sind am
Persistenzrand ungültig. v2 bietet keinen lokalen Upload an, solange kein
exportierbares Assetformat samt Backupvertrag existiert.

`source`, `updatedAt` und optional `sourceRef` beschreiben die Herkunft. Fokus X
und Y liegen jeweils in `[0,1]` und sind entweder beide gesetzt oder beide
fehlend. `zoom` ist optional, endlich und mindestens `1`. Eine Bildprüfung wird
nur als vollständiges Paar `imageCheck.checkedAt/result` gespeichert. `404`
(`not-found`) und falscher Bildinhalt (`invalid-content`) sind definitive
Defekte. `offline`, `timeout`, `network-error`, `rate-limited` und `blocked`
sind transiente/unklare Ergebnisse und dürfen ein Cover weder als defekt
markieren noch löschen. Fehlende Prüfung ist erlaubt.

`FranchisePresentation` ist unabhängig von Saved Views. Nur `franchise` ist
Pflicht; `backgroundUrl`, Fokus X/Y und `overlayStrength` sind optional. Ist ein
Hintergrund gesetzt, gelten dieselben Remote-/Prüfregeln und Herkunft kann
mitgespeichert werden. Fokus X/Y sind gemeinsam gesetzt oder gemeinsam fehlend;
Fokus und Overlay liegen in `[0,1]`. Die Identität ist der getrimmte,
Unicode-normalisierte und case-insensitiv verglichene Franchise-Name; die
gespeicherte Schreibweise bleibt für die Anzeige erhalten.

## 5. Saved Views

Die bekannten v2-Felder einer `SavedView` sind exakt `id`, `name`, `filters`,
`sort`, `displayMode`, `groupBy`, `isDefault` und `kind`. Unbekannte
Zukunftsfelder bleiben opak. `displayMode` ist `list | compact | grid`, `groupBy`
ist `none | franchise`, `kind` ist `system | custom`.

Diese System-IDs, Anzeigenamen und Semantiken sind stabil:

| ID / Name | Filter | Sort | Display / Group |
| --- | --- | --- | --- |
| `system:all-games` / Alle Spiele | leer | `name asc` | `list / none` |
| `system:queue` / Als Nächstes | Queue `has` | `queuePosition asc` | `list / none` |
| `system:currently-playing` / Aktuell gespielt | `played=true` und `finished=false` | `name asc` | `list / none` |
| `system:wishlist` / Wunschliste | `wishlisted=true` | `name asc` | `grid / none` |
| `system:unrated` / Unbewertet | Rating `unrated` | `name asc` | `list / none` |
| `system:recently-added` / Kürzlich hinzugefügt | leer | `dateAdded desc` | `grid / none` |
| `system:favorites` / Favoriten | Favoriten `has` | `favoriteRank asc` | `grid / none` |

Systemdefinitionen werden aus der installierten App materialisiert. Ihre in
`SYSTEM_VIEW_IMMUTABLE_FIELDS` genannten Felder sind unveränderlich; Importdaten
können sie nicht überschreiben. Nur die abgeleitete Default-Markierung darf
wechseln. Custom-IDs sind UUIDs, dürfen nie mit `system:` beginnen und bleiben
bei Umbenennung stabil. Doppelte Custom-Namen sind erlaubt.

`defaultView` ist die autoritative ID. Genau die referenzierte View hat
`isDefault: true`, alle anderen `false`. Beim Normalisieren wird zuerst ein
gültiges `defaultView`, dann eine einzelne gültige `isDefault`-Markierung und
sonst `system:all-games` gewählt. System-Views werden ergänzt, falls sie fehlen.

Dirty-Erkennung vergleicht nur `SAVED_VIEW_DIRTY_FIELDS` strukturell mit der
Session-Baseline. Objektschlüsselreihenfolge ist irrelevant; mengenartige
Filterauswahlen werden dedupliziert und stabil sortiert. `id`, `kind` und
`isDefault` erzeugen kein Content-Dirty. Änderungen an einer System-View werden
nicht gespeichert: UI bietet Verwerfen oder „Als neue View speichern“.

## 6. Provenienz und Metadata-Preview

Relevante Felder können `manual | steam | igdb | import | migration` mit
`updatedAt` und optionalem `sourceRef` tragen. Jede bestätigte manuelle Änderung
setzt `manual`; ein echter Backup-Restore bewahrt vorhandene Provenienz. Fehlende
Provenienz wird nicht erfunden. Nichtleere manuelle Werte dürfen durch
Metadatenabgleich nie vorausgewählt überschrieben werden.

`MetadataFieldChange.defaultSelection` wird in dieser Reihenfolge bestimmt:

1. Leerer/ungültiger Vorschlag: nicht ausgewählt.
2. Definitiv defektes Cover: nicht ausgewählt.
3. Jedes Cover (`coverUrl`, `landscapeArtwork`, `caseArtwork`): nie automatisch,
   auch wenn das Ziel leer ist.
4. Volatile Preise: getrennte `volatilePrices`-Liste, nicht im Metadata-Batch ausgewählt.
5. Leeres Ziel: ausgewählt.
6. Nichtleeres manuelles Ziel: geschützt und nicht ausgewählt.
7. Sonstiges nichtleeres Ziel: Review erforderlich und nicht ausgewählt.

Leer sind `null`, fehlend, ein leerer/Whitespace-String oder ein leeres Array;
`false` und `0` sind nicht leer. Ein Cover gilt nur bei einem Ergebnis in
`DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS` als definitiv defekt; transiente Checks
bleiben unentschieden. Jede Preview speichert Ist-/Vorschlag, beide Provenienzen,
Kategorie und den nachvollziehbaren Auswahlgrund.

## 7. Backup, Import und Atomarität

Der Standardexport enthält alle kanonischen Felder, aber keine Secrets. Die
Option „Secrets einschließen“ erfordert eine sichtbare Warnung und erzeugt nur
nach expliziter Bestätigung ein `SensitiveBackupEnvelope` mit
`warningAcknowledgedAt`. v1-Secrets werden beim Lesen erkannt, aber weder still
in v2 noch in einen Re-Export kopiert; Übernahme in den lokalen Sidecar braucht
dieselbe ausdrückliche Entscheidung.

Import kennt `merge` und `replace`. Beide erstellen erst einen vollständigen
`ImportPlan`, validieren alle Entitäten, lösen Konflikte, rufen dann zwingend den
`BeforeImportSnapshotHook` auf und schreiben genau einmal. Fehler vor oder beim
Schreiben lassen Dokument und Credential-Sidecar unverändert; Teilübernahme ist
unzulässig.

Merge-Identität und Konflikte:

- Games matchen eindeutig in der Reihenfolge ID, Steam App-ID, IGDB-ID,
  normalisierter Name. Der Name-Fallback gilt nur, wenn beide Seiten keine
  externe ID besitzen. Zeigen IDs auf verschiedene bestehende Games oder gibt
  es mehrere Treffer, ist eine explizite Konfliktauflösung nötig. Bei eindeutigem
  Match bleibt die bestehende interne ID, eingehende kanonische Werte gewinnen;
  nur lokal vorhandene unbekannte Extension-Keys bleiben erhalten.
- System-Views werden nie importiert, sondern gegen die Appdefinition ersetzt.
  Eine Custom-View mit System-ID ist ein Konflikt. Gleiche Custom-ID aktualisiert
  die bestehende View; gleiche Namen allein matchen nicht.
- Franchises matchen über den normalisierten Namen. Eingehende Präsentation
  gewinnt; mehrere eingehende Varianten desselben Keys sind ein Konflikt.

`replace` ersetzt Games, Custom-Views, Franchises und Präferenzen vollständig,
ergänzt System-Views und normalisiert Default/Positionen. Der Credential-Sidecar
bleibt ohne bestätigten Sensitive-Envelope unverändert. `merge` und `replace`
führen nach Auflösung zum selben vollständig validierten v2-Kandidaten.

## 8. Undo, Snapshots und Jobs

`UndoTransaction` ist eine kleine serialisierbare Vorher-/Nachher-Einheit und
zunächst Session-only. `LibrarySnapshot` speichert ein vollständiges v2-Dokument
in IndexedDB; Snapshots und Jobs sind nicht Teil normaler Backups. Normative
Snapshot-Gründe sind Import, Clear, Bulk-Delete, große Metadata-Übernahme,
Restore, Daily und Manual; destruktive Pfade wählen den jeweils spezifischen
`before-*`-Grund.

Ein persistierter Job kennt absichtlich keinen Zustand `running`. `running` ist
nur in `SessionJobState` erlaubt, solange eine offene App die Ausführung besitzt.
Vor Persistenz/Shutdown wird er `interrupted`; bei Hydration wird jeder alte oder
fremde Running-Marker vor Anzeige ebenfalls `interrupted`. Pausegründe
unterscheiden mindestens `offline` und `rate-limit`. Retry-Zustand speichert
`nextAttemptAt`, gegebenenfalls `retryAfterSeconds` aus Retry-After sowie
aggregierte Fehler mit Anzahl/letztem Auftreten. Fortschritt weist `processed`,
`remaining` und `failed` getrennt aus. Offline/geschlossen bedeutet „wartet auf
App“ und darf niemals als laufende Arbeit dargestellt werden.
Background-Ausführung benötigt später einen eigenen, beweisbaren
Service-Worker-Vertrag.

## 9. Integrationsreihenfolge

F1 besitzt Dokumentparser, Migration, Registry-Erweiterung, Normalisierung und
atomare Repository-Grenze. F3 konsumiert Operations-/Job-/Snapshot-Verträge; F4
konsumiert Saved-View-/Display-/Group-Verträge. Medien, Metadaten, Backup/Import
und Jobs konsumieren ausschließlich die
öffentlichen Typen aus `lib/model`; sie dürfen keine zweite Definition für IDs,
Positionen, Provenienz oder Secret-Policy einführen.
