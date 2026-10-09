# Anschluss1.de – Stromnetzanschlüsse vorplanen

Produktiv: https://www.anschluss1.de/ · Hosting: Vercel · Repository: YBen1/anschluss1.de.

Die Startseite zeigt den deutschlandweiten Netzplanungs-MVP. Die bisherige interaktive Lernseite zur TA Mittelspannung Berlin ist vollständig unter /wissen erhalten; Details in WISSEN.md.

## Dateien und Betrieb

Statische Anwendung ohne Build oder Installation: index.html, app.js, engine.js, regions.js, style.css, config.json, vendor/, data/. Lokal: `python3 -m http.server 8787`. Für /wissen lokal wissen.html öffnen; Vercel richtet die saubere Route über vercel.json ein.

## Funktionen

Reale OSM-Netzdaten, Adress-/Koordinatensuche, Kartenpunkt oder Flächenskizze, Leistungsbedarf und Energierichtung, Spannung-/Betreiberfilter, bis zu drei räumliche Anschlusskandidaten, editierbares Kostenmodell mit offenen Positionen, Standortvergleich und HTML-Bericht mit Karte zum PDF-Druck. Amtliche Flurstückskarten aller 16 Bundesländer können ab Zoom 17 zugeschaltet werden; Bayern als Parzellarkarte ohne Flurstücksnummern.

107.519 Stationen und 76.990 Leitungsobjekte, OSM-Snapshot vom 03.10.2026. Keine bestätigten Kapazitäten; keine automatische Trassen- oder Hindernisprüfung. Unbekannte Preise werden nicht mit null angesetzt. Quellen und Lizenzprüfung: SOURCES.md; Datenmanifest: data/manifest.json; Prüfungen: VERIFICATION.md.

## Tests

`node --test tests/engine.test.mjs tests/data.test.mjs tests/regions.test.mjs`.

Browserprüfung: `node tests/browser-regions.mjs` bei laufendem Testserver auf Port 8788 und Chromium mit CDP auf Port 9334. Optional `TEST_URL` und `CDP_URL` setzen. Externe Kartenkacheln werden im Test blockiert.

## Veröffentlichung

Pushes auf den bestehenden Hauptbranch dieses GitHub-Repositories werden vom angebundenen Vercel-Projekt veröffentlicht. Der frühere Sites-Prototyp ist ein getrenntes Deployment und aktualisiert diese Domain nicht. Keine Sites-Manifestdatei in dieses Repository übernehmen.

## Datenschutz und externe Dienste

Kein Tracking, keine Konten. Projektstandorte und eigene Preise bleiben in der Sitzung. Sichtbare Kartenkacheln: OpenStreetMap; Adresseingaben ab drei Zeichen nach Tipp-Pause: Photon/Komoot; optional die im Kartenausschnitt benötigten amtlichen Flurstücksdienste. Die CSP erlaubt ausschließlich diese benötigten externen Dienste. Für größere öffentliche Last eigenen/vertraglichen Geocoder verwenden. Endpunkte sind in config.json konfigurierbar; bei Anbieterwechsel CSP ebenfalls anpassen.

## Regionale Karte

Die Startansicht zeigt die 16 Bundesländer. Landeswahl per Karte oder Auswahlfeld; ab Zoom 9 lädt die Karte die Bundeslanddateien im sichtbaren Ausschnitt. Unter Zoom 9 wird nur ein ausdrücklich ausgewähltes Bundesland geladen. „Deutschland“ kehrt zur leichten Übersicht zurück. Spannungsfilter bleiben innerhalb der regionalen Ansicht anwendbar.

`data/states.json` enthält vereinfachte OSM-Landesgrenzen, Objektabdeckungen, Dateigrößen, Prüfsummen und Betreiber. `data/states/DE-XX-{stations,lines}.json` enthält die unveränderten Originalobjekte. Grenzüberschreitende Leitungen stehen in mehreren Dateien und werden im Browser anhand ihrer OSM-ID dedupliziert. Einträge außerhalb der aus demselben Snapshot extrahierten Landespolygone werden dem nächstgelegenen Land zugewiesen; die Objektabdeckung im Index schließt sie weiterhin ein.

Kandidatensuche und Standortvergleich laden sämtliche Stationen innerhalb der Bundeslandabdeckungen, die den 50-km-Suchkreis berühren. Die Anzeigeauswahl beschränkt die Kandidatensuche nicht. Berichte laden die benötigten regionalen Leitungen zusätzlich. Ein begrenzter LRU-Cache hält höchstens zwölf Datendateien; parallele Abrufe derselben Datei werden zusammengeführt. Versionsparameter aus SHA-256 und HTTP-Cache ermöglichen wiederholte Aufrufe. Veraltete Suchergebnisse werden verworfen; fehlgeschlagene Abrufe können erneut gestartet werden.

Regenerierung: `python scripts/split-states.py /path/to/germany.osm.pbf /path/to/cache` mit osmium und shapely sowie nationalen Ausgangsdateien in `data/`. Der PBF muss zum Snapshot der nationalen Ausgangsdaten passen. Nationale Originaldateien bleiben für Quellen-Downloads und Vollständigkeitsprüfungen erhalten, werden von der Kartenanwendung aber nicht automatisch geladen.

## Adressvorschläge

Die Adresseingabe zeigt ab drei Zeichen bis zu sechs Vorschläge nach 450 ms Tipp-Pause. Der bestehende Mindestabstand zwischen externen Suchanfragen (1.500 ms) bleibt erhalten. Neue Eingaben brechen laufende Anfragen ab; überholte Antworten werden ignoriert. Bis zu 30 Suchbegriffe werden nur im Arbeitsspeicher der geöffneten Seite zwischengespeichert. Koordinaten werden lokal verarbeitet. Auswahl per Klick/Touch oder Pfeiltasten und Enter; Escape und Verlassen des Felds schließen die Liste. Bei leeren Ergebnissen oder Fehlern erscheint ein Hinweis.

Browserprüfung: `node tests/browser-address.mjs` mit demselben Testserver/CDP wie beim Kartentest. Deterministische Photon-Antworten decken Tipp-Pause, Cache, Tastatur, Auswahl, überholte Antworten, Fehler, Koordinaten und mobile Darstellung ab.

## Flurstückskarten

Unter Kartenebenen „Amtliche Flurstücke“ einschalten. Ist ein Projektstandort gewählt, zoomt die Karte dorthin auf Stufe 17. Andernfalls am gewünschten Ort hineinzoomen oder „Flurstücke am Standort anzeigen“ wählen. Die Landesdienste werden nur im Detailzoom und für den sichtbaren Ausschnitt zugeschaltet. Beim Herauszoomen oder Abschalten werden die Ebenen entfernt. Ein Dienstfehler erscheint mit einer Wiederholungsmöglichkeit.

`data/parcel-services.json` dokumentiert alle 16 amtlichen Anbieter, WMS-Layer/Stile/Version, räumliche Abdeckung, Quellen, Lizenzen, Prüfdatum und je einen echten Teststandort. Bayern liefert die reduzierte Parzellarkarte ohne Flurstücksnummern, Baden-Württemberg und Rheinland-Pfalz eine Liegenschaftskarte mit weiteren Katasterinhalten. Die übrigen Adapter verwenden Flurstücks- bzw. INSPIRE-Parzellenlayer. Die Anzeige übernimmt Kartendarstellungen, keine Eigentümerdaten und keine vermessungstechnisch geprüften Polygone. Die Landesbilder werden nicht in den schematischen HTML-Bericht übernommen.

Prüfungen: `node tests/parcels.test.mjs`; expliziter Live-Bildtest mit Pillow: `python3 scripts/check-parcel-services.py /tmp/parcel-check` (optionale nachfolgende Bundesland-IDs schränken den Test ein). Browserprüfung: `node tests/browser-parcels.mjs` mit lokalem Server/CDP wie oben, optional `TEST_URL`. Anders als der allgemeine Kartentest ruft dieser Test reale Katasterkarten ab; OSM-Kacheln bleiben blockiert.

## Flurstück auf der Karte auswählen

Unter „Standort festlegen“ **Flurstück auf Karte auswählen** einschalten, eine Adresse suchen und im Detailzoom innerhalb eines Flurstücks klicken. Der Auswahlmodus aktiviert die amtliche Kartenebene. Treffen mehrere Flurstücke zusammen, erscheint eine Auswahlliste. Kennzeichen, Nummer, Gemarkung/Flur und amtliche Fläche werden angezeigt, soweit der Dienst diese Angaben liefert. „Flurstück als Standort übernehmen“ speichert die Auswahl am angeklickten Bezugspunkt für Netzplanung, Standortvergleich und Bericht. Weitere Flurstücke können nacheinander als Vergleichsstandorte gespeichert werden.

Vollständige Grenzen werden in Baden-Württemberg, Berlin, Brandenburg, Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen, Sachsen-Anhalt und Schleswig-Holstein orange hervorgehoben, soweit in der Antwort vorhanden. Bremen, Hamburg, Hessen, Saarland, Sachsen und Thüringen liefern im verwendeten GetFeatureInfo-Aufruf Sachdaten ohne Polygon: Hier kennzeichnet ein Punkt die Auswahl. Bayern und Rheinland-Pfalz unterstützen im vorhandenen Kartendienst keine Einzelabfrage; die Oberfläche bietet ausdrücklich eine manuelle Kartenpunktauswahl bzw. „Fläche zeichnen“ an. Fehlende Treffer und Dienstfehler werden nicht als erfolgreiche Flurstücksauswahl behandelt.

Die Abfrage erfolgt nur auf Klick. Landeszuständigkeit wird anhand der vorhandenen OSM-Landesgeometrien eingegrenzt. Die festen `/parcel-service/DE-XX`-Rewrites in `vercel.json` ermöglichen die Abfrage der Landesdienste über dieselbe Domain, auch wenn diese kein CORS anbieten. Es werden ausschließlich ausgewählte Flurstücksmerkmale übernommen, keine Eigentümerangaben. Koordinaten werden zur Abfrage an den jeweiligen Landesdienst weitergeleitet. Quelle und Lizenz bleiben bei der Auswahl und im Bericht erhalten; Kartenbilder werden nicht exportiert.

Lokaler Server einschließlich dieser Rewrites: `python3 scripts/serve-dev.py`. Browserprüfung bei Chromium-CDP auf Port 9334: `node tests/browser-parcel-selection.mjs`. Sie prüft 14 reale Antwort-Fixtures, echte Auswahl in Berlin/Sachsen, manuelle Auswahl in Bayern, Vergleich, Bericht, Fehlermeldung/Retry, Moduswechsel und mobile Darstellung. Fixtures wurden am 09.10.2026 an den dokumentierten Teststandorten abgefragt; in der BW-Fixture sind ausschließlich Geometrien nicht relevanter Verwaltungs-/Straßenobjekte entfernt. Quellen und Lizenzen siehe `data/parcel-services.json`.


## Anschlussanmeldung und Projektführung

Die Planung ist in vier Schritte gegliedert. Der Anmeldeschritt fragt mit Koordinate und gewünschter Anschlussebene die VNBdigital-Suche ab und zeigt das zugehörige Betreiberprofil sowie dessen ausdrücklich aktivierte Netzanschluss-Links. Der Aufruf öffnet das externe Portal; er versendet keine Anmeldung. Bei Höchstspannung wird keine automatische VNB-Zuordnung behauptet. VNBdigital-Antworten sind eine Vorabzuordnung, die der Betreiber bestätigen muss.

Koordinaten, Vergleichsstandorte, Kostenmodell und Planungseinstellungen können im lokalen Browser-Speicher abgelegt, beim nächsten Besuch wiederhergestellt und dort gelöscht werden. Der Speicher wird nicht zum Server übertragen. Die Karte bleibt neben dem schrittweisen Seitenpanel sichtbar; dieses lässt sich auf dem Desktop einklappen und auf dem Mobilgerät aufziehen.
