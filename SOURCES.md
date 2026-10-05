# Quellenprüfung (05.10.2026)

| Quelle | Einbindung | Abdeckung / Stand | Nutzungsrahmen / Einschränkung |
|---|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) über [Geofabrik Deutschland](https://download.geofabrik.de/europe/germany.html) | Stations- und Leitungsdaten | Ganz Deutschland; konkreter PBF-Zeitstempel im Manifest. Regional unvollständig, MS/Kabel besonders lückenhaft | ODbL 1.0, sichtbare Namensnennung; bearbeiteter Datenauszug wird als JSON zum Download mitveröffentlicht |
| [OSM Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) | Grenze Relation 51477; Infrastrukturabruf zunächst versucht | Minutenaktuelle API, praktische Erreichbarkeit wechselhaft | OSM ODbL; öffentliche Abfrageinstanzen schonen; keine Browserabfragen im ausgelieferten Produkt |
| [OSM Kacheln](https://operations.osmfoundation.org/policies/tiles/) | Basiskarte | Sichtbarer Kartenausschnitt | Normales Browsercaching und Referer, Attribution; kein Prefetch / Offline-Download; automatisierte UI-Tests blockieren Kachelabrufe |
| [Photon von Komoot](https://github.com/komoot/photon#demo-server) | Adress-/Ortssuche nach Absenden | OSM-basiert, keine SLA; Treffer räumlich auf Deutschland geprüft | Öffentliche Demo für moderate Nutzung. 1,5 s lokale Drosselung und Sitzungscache. Für größeren Betrieb eigener / vertraglicher Dienst; konfigurierbarer Endpunkt |
| [Netze BW BKZ 2026](https://assets.cdn.netze-bw.de/xytfb1vrn7of/3WkwLb2wCAE2YcQuG0YU4m/cff72cf6af73c9b225d0268390f45ebf/preisuebersicht-baukostenzuschuss-bkz-strom.pdf) | Einzelne publizierte Tarifwerte mit Quellenlink | Gültig ab 01.01.2026; Betreiber und Eigentumsgrenze entscheidend | Einzelne numerische Fakten, kein Nachdruck des Dokuments; Gültigkeit für das konkrete Projekt ausdrücklich unbestätigt |
| [BNetzA Speicher/BKZ](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/Speicher/_faq/faq_table4.html) | Erklärung, warum BKZ für Speicher nicht null angenommen wird | Aktuelle öffentliche FAQ, geprüft 05.10.2026 | Verlinkung und knappe Paraphrase, keine individuelle rechtliche Prüfung |
| [BKG FS-DE](https://gdz.bkg.bund.de/index.php/default/flurstuecksinformationen-deutschland-fs-de.html) | Recherche, **nicht eingebunden** | Amtliche Flurstücke, Daten für Bundesbehörden und Nutzungsberechtigte nach V GeoBund | Kein allgemein freier Weiterverwendungsnachweis für dieses Produkt; kostenlose Bereitstellung ist keine offene Lizenz |

Es wird keine deutschlandweit vollständige physische Netzaufnahme behauptet. OSM-Objektangaben sind quellenbelegte Kartierungsangaben und nicht automatisch betreiberbestätigt. Einheiten, Spannungen, Betreiber oder freie Kapazitäten werden nicht ergänzt, wenn sie fehlen. Geometrisch abgeleitete Werte und nutzerseitige Schätzpreise bleiben separat.

## Drittlizenzen

Leaflet 1.9.4: BSD-2-Clause, Copyright Vladimir Agafonkin und Mitwirkende. Lizenztext in `dist/vendor/leaflet-LICENSE.txt`. OSM-Daten separat ODbL 1.0. Keine externen Schriften erforderlich; System-Fallbacks vorhanden.

## Regionaler Katasteradapter NRW

Eingebunden: [WMS NW ALKIS](https://www.wms.nrw.de/geobasis/wms_nw_alkis?SERVICE=WMS&REQUEST=GetCapabilities), Layer `adv_alkis_flurstuecke`, Stil `Grau`, ab Zoom 17, nur räumlich NRW. Am 05.10.2026 geladene Capabilities erklären Datenlizenz Deutschland Zero 2.0 und AccessConstraints NONE. Quelle Geobasis NRW wird trotzdem sichtbar genannt. Der Dienst ist nur eine amtliche Kartendarstellung; keine amtliche Geometrieübernahme und kein Eigentumsnachweis. Einzelobjekt-Datenstand bleibt ungeprüft (wäre über GetFeatureInfo abrufbar). Koordinatentransformation EPSG:3857 ist keine amtliche Koordinatenausgabe; nur EPSG:25832 ist laut Dienstbeschreibung amtlich. Der Export enthält eine schematische OSM-Karte und eigene Flächenskizze, keine NRW-WMS-Kachel.
