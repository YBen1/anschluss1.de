# MVP-Abnahme · 05.10.2026

## Daten

- 107.519 Stationsobjekte und 76.990 Leitungsobjekte, OSM-/Geofabrik-Datenstand 03.10.2026 20:20:50 UTC.
- Nur Stationen innerhalb der Deutschlandgeometrie und Leitungen, die sie schneiden. Grenzüberschreitende Linien werden nicht auf deutsche Segmente beschnitten.
- Deutschlandgrenze OSM-Relation 51477, Quell-Snapshot 15.07.2026. Separat im Manifest dokumentiert.
- IDs, Zeitstempel, Geometrien, Objektzahlen und SHA-256-Integrität geprüft (`tests/data.test.mjs`). Tests an neun städtischen/ländlichen Orten von Flensburg bis Bodensee erfolgreich; Paris, Wien, Amsterdam und Nullkoordinate abgewiesen.
- Quellen und Lizenzbedingungen in SOURCES.md; Daten-Downloads einschließlich ODbL-Hinweis öffentlich innerhalb der privaten Site bereitgestellt.
- NRW-WMS: Capabilities mit dl-de/zero-2-0 und Layername geprüft; repräsentativer GetMap-Aufruf liefert PNG. Objektbezogene Katasteraktualität bleibt ungeprüft und so beschriftet.

## Rechenlogik

Acht erfolgreiche Tests (`node tests/engine.test.mjs`):

- fehlende Preise/Mengen ergeben keinen Gesamtpreis;
- vollständige eigene Szenarien ergeben nachvollziehbare Mengen × Einheitspreise;
- bereits ein offenes Szenario blockiert eine vollständige Gesamtbandbreite;
- Netze-BW-Tarif nur bei exakt passendem Operator, HS und Bezug/beidem;
- Preise anderer Ebenen werden nicht übertragen;
- N−1 ohne zweiten geprüften Netzpfad bleibt offen;
- Kandidaten berücksichtigen Radius, Spannung, Operator und Sonderanlagen;
- ungültige Leistung, unsortierte Szenarien und fehlende Preisprovenienz werden abgewiesen;
- Geometrieabstände, Grenzen, Löcher und selbstkreuzende Flächen geprüft.

## Browser

Isolierter Chromium, Desktop 1440 × 1100 und Mobil 390 × 844. Erfolgreich geprüft:

- echte lokale Daten geladen, drei Kandidaten für Leipzig;
- Koordinatensuche und Detaildialog;
- sichtbare Kostenlücken; Eingabe eigener **ausschließlich im Test verwendeter** Preise liefert Bandbreite;
- zwei Standorte werden mit gleichem Bedarf verglichen;
- Redundanz blockiert eine scheinbar vollständige Schätzung;
- Wechsel der Projektart überträgt alte eigene Preise nicht automatisch;
- Bericht enthält eingebettete SVG-Lagekarte, Eingaben, Kosten, Quellen, Annahmen und offene Fragen;
- Mobilansicht und Vergleich ohne horizontalen Überlauf;
- keine JavaScript-Laufzeitfehler.

Automatisierte Browserprüfungen blockieren OSM-Kacheln und NRW-WMS, um bei programmatischen Ansichtswechseln keine Kartendienste zu belasten. Screenshots zeigen deshalb bewusst die echte Infrastruktur ohne Hintergrundkacheln. Testartefakte sind ignoriert und werden nicht veröffentlicht. Adresssuche hängt vom externen Photon-Dienst ab; Koordinaten und Kartenklick funktionieren ohne diesen Dienst.

WebMCP: Zwei Tools mit Schemata und Annotationen registrieren korrekt in einer injizierten kompatiblen Testschnittstelle. Gültige Eingaben verändern denselben sichtbaren Zustand, ungültige Eingaben werden ohne Zustandsänderung abgewiesen; Readback geprüft. Ein nativer WebMCP-Host stand nicht zur Verfügung. Die normale Browsernutzung benötigt WebMCP nicht.

## Bewusst offene fachliche Grenzen

Keine bestätigten Kapazitäten, keine Betreiberzuständigkeitskarte, kein Lastfluss, keine automatische Hindernis-/Querungsanalyse, keine N−1-Dimensionierung, keine Ausführungsplanung. Außer dem eng anwendbaren publizierten BKZ-Tarif werden keine unbelegten Standardpreise behauptet. Daher ist ein offener Gesamtpreis bei der ersten Nutzung das fachlich richtige Ergebnis: Jede fehlende Kostenposition wird benannt und kann durch Angebote/ausdrückliche eigene Annahmen ergänzt werden.

Der ausgelieferte Datenbestand ist ein dokumentierter Snapshot der ausgewählten öffentlich nutzbaren Quellen, kein Anspruch auf vollständige Erfassung aller physischen Anlagen oder aller existierenden Datenquellen. Amtliche Flurstücke sind zunächst regional in NRW darstellbar. Die übrigen Länder bleiben manuell skizzierbar. Weitere regionale Quellen können über den dokumentierten Adapter ergänzt werden.

Zusätzliche Browserprüfung bestanden: Flächenzeichnung durch drei Kartenpunkte, Betreiber-/Leitungstypfilter, ungültige Leistung und echte Photon-Ortssuche nach Leipzig. Die ungültige Leistung setzt Kandidaten und Speicherknopf zurück; veraltete Ergebnisse werden nicht weiter angezeigt.

## Bundesländerkarte – 08.10.2026

- `node --test tests/engine.test.mjs tests/data.test.mjs tests/regions.test.mjs`: alle drei Testsuiten bestanden. Bestehende Kosten-/Geometrieprüfungen unverändert.
- Alle 16 Bundesländer aus dem vorhandenen PBF extrahiert. Vollständigkeitsvergleich einschließlich unveränderter Objektdaten: 107.519 eindeutige Stationen, 76.990 eindeutige Leitungen. Regionale Prüfsummen, Größen und Objektzahlen stimmen mit dem Index überein. Grenzleitungen werden vollständig in mehreren Ländern vorgehalten und bei Verwendung dedupliziert.
- An 19 Stadt-, Land- und Grenzstandorten sämtliche Stationen innerhalb 50 km mit dem Gesamtbestand abgeglichen; Kandidaten für MS/HS/HöS und Spannungsfilter identisch.
- Browserprüfung `tests/browser-regions.mjs`: Startübersicht ohne nationale Infrastrukturdateien oder regionale Datendateien; Landeswahl per Kartenklick und Auswahlfeld; regionale Abrufe und Cache-Wiederverwendung; Suche, Kandidatendetails, eigene Preise, zwei Vergleichsstandorte, Tool-Schnittstelle, HTML-Bericht mit SVG, Rückkehr zur Deutschlandübersicht, mobile Ansicht ohne horizontalen Überlauf; Fehlerabruf mit anschließendem erfolgreichen Retry; schnelle Standortwechsel; ungültige Leistung entfernt alte Ergebnisse. Keine JavaScript-Ausnahmen.
- Initiale unkomprimierte Datenmenge vorher: 49.517.218 Bytes; jetzt: 4.046.955 Bytes (Landesindex, Deutschlandgrenze und Manifest). Reduktion: 91,83 %. Dies beschreibt Datenmenge, keine pauschale Laufzeitgarantie; Browser-, Netz- und Kompressionsbedingungen variieren.
- Externe Kartenkacheln und NRW-WMS werden im automatisierten Test blockiert. Die Netzdaten und Bundesländergeometrien wurden über den lokalen Server geprüft. Bildschirmaufnahmen und Netzwerkprotokoll: `/tmp/anschluss-regions-results/`.
- Fehler im bestehenden CSS korrigiert: Die Druck-Media-Query wurde nicht geschlossen und schloss folgende Bildschirmregeln ein. Filterfelder bleiben jetzt innerhalb der Kartenhöhe scrollbar.

## Adressvorschläge – 08.10.2026

- `node tests/browser-address.mjs`: bestanden. Vorschläge ab drei Zeichen nach Tipp-Pause, nur die letzte schnelle Eingabe wird angefragt, wiederholte Suche aus Cache, ARIA-Combobox mit Pfeiltasten/Enter und Escape, Auswahl per Klick, veraltete Antworten verworfen, leere Ergebnisse und Fehler, Koordinaten ohne externe Anfrage, mobile Ansicht ohne Überlauf. Photon-Antworten für reproduzierbare Fehler-/Rennbedingungen kontrolliert simuliert.
- `node tests/browser-address-real.mjs`: bestanden mit echtem Photon-Aufruf „Alexanderplatz 1 Berlin“, Auswahl durch Browser-Mausereignisse und drei anschließend berechneten Anschlusskandidaten.
- `node tests/browser-regions.mjs`: bestehender vollständiger Kartenablauf weiterhin bestanden, einschließlich Bundesländer, Vergleich, Export, Ladefehler und Standortwechsel. Keine JavaScript-Ausnahmen.
- Suchdaten nur im begrenzten Seitenspeicher; laufende Abrufe abbrechbar, Timeout 15 Sekunden, Mindestabstand 1,5 Sekunden. Datenschutzhinweise an automatische Vorschläge angepasst.

## Amtliche Flurstückskarten – 08.10.2026

- Alle 16 Landesdienste per GetCapabilities auf Layer, Stil, Projektion und Nutzungsangaben geprüft. `data/parcel-services.json` dokumentiert die eingesetzten Konfigurationen und echten Referenzstandorte.
- Live-Bildprüfung: 512 × 512 Pixel, EPSG:3857, je ein Kartenausschnitt pro Bundesland. Alle 16 liefern decodierbare PNGs mit sichtbaren Karteninhalten. Metadaten-URLs in Rheinland-Pfalz und Saarland lieferten zunächst ServiceExceptions und wurden durch die offiziell ausgewiesenen GetMap-Adressen ersetzt; beide Nachtests bestanden. Keine leeren PNGs oder XML-Fehler als Erfolg gewertet.
- Bildnachweise `/tmp/anschluss-parcel-tests/`, RP/SL-Nachtests `/tmp/anschluss-parcel-retest/`; Stichproben Berlin, Bayern und Rheinland-Pfalz visuell kontrolliert.
- `node tests/browser-parcels.mjs`: alle 16 Landesdienste über die echte Kartenoberfläche erfolgreich geladen, Quellenvermerke vorhanden, keine Katasterabrufe vor Aktivierung oder im Deutschlandzoom; Ausschalten und Herauszoomen entfernen die Ebenen. Simulierter Berliner Dienstausfall sichtbar gemeldet und per Wiederholen erfolgreich behoben. Keine JavaScript-Ausnahmen. Nachweise `/tmp/anschluss-parcel-browser/`.
- `node --test tests/parcels.test.mjs tests/engine.test.mjs`: bestanden, einschließlich vollständiger Länderabdeckung, CSP-Hostfreigaben, Zoom-/Gebietsbegrenzung und bestehender Berechnungen.
- Bayern: reduzierte Parzellarkarte ohne Flurstücksnummern. BW/RP: weitere Liegenschaftsinhalte enthalten. Landesdienste liefern Darstellungen; keine Eigentümerdaten und keine Übernahme amtlicher Flurstückspolygone in die manuelle Skizze. WMS-Bilder werden nicht in den schematischen Bericht eingebettet.
