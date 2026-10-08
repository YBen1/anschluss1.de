# Anschluss1.de – Stromnetzanschlüsse vorplanen

Produktiv: https://www.anschluss1.de/ · Hosting: Vercel · Repository: YBen1/anschluss1.de.

Die Startseite zeigt den deutschlandweiten Netzplanungs-MVP. Die bisherige interaktive Lernseite zur TA Mittelspannung Berlin ist vollständig unter /wissen erhalten; Details in WISSEN.md.

## Dateien und Betrieb

Statische Anwendung ohne Build oder Installation: index.html, app.js, engine.js, regions.js, style.css, config.json, vendor/, data/. Lokal: `python3 -m http.server 8787`. Für /wissen lokal wissen.html öffnen; Vercel richtet die saubere Route über vercel.json ein.

## Funktionen

Reale OSM-Netzdaten, Adress-/Koordinatensuche, Kartenpunkt oder Flächenskizze, Leistungsbedarf und Energierichtung, Spannung-/Betreiberfilter, bis zu drei räumliche Anschlusskandidaten, editierbares Kostenmodell mit offenen Positionen, Standortvergleich und HTML-Bericht mit Karte zum PDF-Druck. Amtliche Flurstücke NRW können ab Zoom 17 zugeschaltet werden.

107.519 Stationen und 76.990 Leitungsobjekte, OSM-Snapshot vom 03.10.2026. Keine bestätigten Kapazitäten; keine automatische Trassen- oder Hindernisprüfung. Unbekannte Preise werden nicht mit null angesetzt. Quellen und Lizenzprüfung: SOURCES.md; Datenmanifest: data/manifest.json; Prüfungen: VERIFICATION.md.

## Tests

`node --test tests/engine.test.mjs tests/data.test.mjs tests/regions.test.mjs`.

Browserprüfung: `node tests/browser-regions.mjs` bei laufendem Testserver auf Port 8788 und Chromium mit CDP auf Port 9334. Optional `TEST_URL` und `CDP_URL` setzen. Externe Kartenkacheln werden im Test blockiert.

## Veröffentlichung

Pushes auf den bestehenden Hauptbranch dieses GitHub-Repositories werden vom angebundenen Vercel-Projekt veröffentlicht. Der frühere Sites-Prototyp ist ein getrenntes Deployment und aktualisiert diese Domain nicht. Keine Sites-Manifestdatei in dieses Repository übernehmen.

## Datenschutz und externe Dienste

Kein Tracking, keine Konten. Projektstandorte und eigene Preise bleiben in der Sitzung. Sichtbare Kartenkacheln: OpenStreetMap; abgesendete Suchbegriffe: Photon/Komoot; optional NRW-WMS. Die CSP erlaubt ausschließlich diese benötigten externen Dienste. Für größere öffentliche Last eigenen/vertraglichen Geocoder verwenden. Endpunkte sind in config.json konfigurierbar; bei Anbieterwechsel CSP ebenfalls anpassen.

## Regionale Karte

Die Startansicht zeigt die 16 Bundesländer. Landeswahl per Karte oder Auswahlfeld; ab Zoom 9 lädt die Karte die Bundeslanddateien im sichtbaren Ausschnitt. Unter Zoom 9 wird nur ein ausdrücklich ausgewähltes Bundesland geladen. „Deutschland“ kehrt zur leichten Übersicht zurück. Spannungsfilter bleiben innerhalb der regionalen Ansicht anwendbar.

`data/states.json` enthält vereinfachte OSM-Landesgrenzen, Objektabdeckungen, Dateigrößen, Prüfsummen und Betreiber. `data/states/DE-XX-{stations,lines}.json` enthält die unveränderten Originalobjekte. Grenzüberschreitende Leitungen stehen in mehreren Dateien und werden im Browser anhand ihrer OSM-ID dedupliziert. Einträge außerhalb der aus demselben Snapshot extrahierten Landespolygone werden dem nächstgelegenen Land zugewiesen; die Objektabdeckung im Index schließt sie weiterhin ein.

Kandidatensuche und Standortvergleich laden sämtliche Stationen innerhalb der Bundeslandabdeckungen, die den 50-km-Suchkreis berühren. Die Anzeigeauswahl beschränkt die Kandidatensuche nicht. Berichte laden die benötigten regionalen Leitungen zusätzlich. Ein begrenzter LRU-Cache hält höchstens zwölf Datendateien; parallele Abrufe derselben Datei werden zusammengeführt. Versionsparameter aus SHA-256 und HTTP-Cache ermöglichen wiederholte Aufrufe. Veraltete Suchergebnisse werden verworfen; fehlgeschlagene Abrufe können erneut gestartet werden.

Regenerierung: `python scripts/split-states.py /path/to/germany.osm.pbf /path/to/cache` mit osmium und shapely sowie nationalen Ausgangsdateien in `data/`. Der PBF muss zum Snapshot der nationalen Ausgangsdaten passen. Nationale Originaldateien bleiben für Quellen-Downloads und Vollständigkeitsprüfungen erhalten, werden von der Kartenanwendung aber nicht automatisch geladen.
