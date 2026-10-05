# Anschluss1.de – Stromnetzanschlüsse vorplanen

Produktiv: https://www.anschluss1.de/ · Hosting: Vercel · Repository: YBen1/anschluss1.de.

Die Startseite zeigt den deutschlandweiten Netzplanungs-MVP. Die bisherige interaktive Lernseite zur TA Mittelspannung Berlin ist vollständig unter /wissen erhalten; Details in WISSEN.md.

## Dateien und Betrieb

Statische Anwendung ohne Build oder Installation: index.html, app.js, engine.js, style.css, config.json, vendor/, data/. Lokal: `python3 -m http.server 8787`. Für /wissen lokal wissen.html öffnen; Vercel richtet die saubere Route über vercel.json ein.

## Funktionen

Reale OSM-Netzdaten, Adress-/Koordinatensuche, Kartenpunkt oder Flächenskizze, Leistungsbedarf und Energierichtung, Spannung-/Betreiberfilter, bis zu drei räumliche Anschlusskandidaten, editierbares Kostenmodell mit offenen Positionen, Standortvergleich und HTML-Bericht mit Karte zum PDF-Druck. Amtliche Flurstücke NRW können ab Zoom 17 zugeschaltet werden.

107.519 Stationen und 76.990 Leitungsobjekte, OSM-Snapshot vom 03.10.2026. Keine bestätigten Kapazitäten; keine automatische Trassen- oder Hindernisprüfung. Unbekannte Preise werden nicht mit null angesetzt. Quellen und Lizenzprüfung: SOURCES.md; Datenmanifest: data/manifest.json; Prüfungen: VERIFICATION.md.

## Tests

`node tests/engine.test.mjs` und `node tests/data.test.mjs`.

## Veröffentlichung

Pushes auf den bestehenden Hauptbranch dieses GitHub-Repositories werden vom angebundenen Vercel-Projekt veröffentlicht. Der frühere Sites-Prototyp ist ein getrenntes Deployment und aktualisiert diese Domain nicht. Keine Sites-Manifestdatei in dieses Repository übernehmen.

## Datenschutz und externe Dienste

Kein Tracking, keine Konten. Projektstandorte und eigene Preise bleiben in der Sitzung. Sichtbare Kartenkacheln: OpenStreetMap; abgesendete Suchbegriffe: Photon/Komoot; optional NRW-WMS. Die CSP erlaubt ausschließlich diese benötigten externen Dienste. Für größere öffentliche Last eigenen/vertraglichen Geocoder verwenden. Endpunkte sind in config.json konfigurierbar; bei Anbieterwechsel CSP ebenfalls anpassen.
