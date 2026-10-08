# Quellenprüfung (05.10.2026)

| Quelle | Einbindung | Abdeckung / Stand | Nutzungsrahmen / Einschränkung |
|---|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) über [Geofabrik Deutschland](https://download.geofabrik.de/europe/germany.html) | Stations- und Leitungsdaten | Ganz Deutschland; konkreter PBF-Zeitstempel im Manifest. Regional unvollständig, MS/Kabel besonders lückenhaft | ODbL 1.0, sichtbare Namensnennung; bearbeiteter Datenauszug wird als JSON zum Download mitveröffentlicht |
| [OSM Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) | Grenze Relation 51477; Infrastrukturabruf zunächst versucht | Minutenaktuelle API, praktische Erreichbarkeit wechselhaft | OSM ODbL; öffentliche Abfrageinstanzen schonen; keine Browserabfragen im ausgelieferten Produkt |
| [OSM Kacheln](https://operations.osmfoundation.org/policies/tiles/) | Basiskarte | Sichtbarer Kartenausschnitt | Normales Browsercaching und Referer, Attribution; kein Prefetch / Offline-Download; automatisierte UI-Tests blockieren Kachelabrufe |
| [Photon von Komoot](https://github.com/komoot/photon#demo-server) | Adress-/Ortssuche und Vorschläge ab drei Zeichen nach Tipp-Pause | OSM-basiert, keine SLA; Treffer räumlich auf Deutschland geprüft | Öffentliche Demo für moderate Nutzung. 1,5 s lokale Drosselung und begrenzter Arbeitsspeicher-Cache. Für größeren Betrieb eigener / vertraglicher Dienst; konfigurierbarer Endpunkt |
| [Netze BW BKZ 2026](https://assets.cdn.netze-bw.de/xytfb1vrn7of/3WkwLb2wCAE2YcQuG0YU4m/cff72cf6af73c9b225d0268390f45ebf/preisuebersicht-baukostenzuschuss-bkz-strom.pdf) | Einzelne publizierte Tarifwerte mit Quellenlink | Gültig ab 01.01.2026; Betreiber und Eigentumsgrenze entscheidend | Einzelne numerische Fakten, kein Nachdruck des Dokuments; Gültigkeit für das konkrete Projekt ausdrücklich unbestätigt |
| [BNetzA Speicher/BKZ](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/Speicher/_faq/faq_table4.html) | Erklärung, warum BKZ für Speicher nicht null angenommen wird | Aktuelle öffentliche FAQ, geprüft 05.10.2026 | Verlinkung und knappe Paraphrase, keine individuelle rechtliche Prüfung |
| [BKG FS-DE](https://gdz.bkg.bund.de/index.php/default/flurstuecksinformationen-deutschland-fs-de.html) | Recherche, **nicht eingebunden** | Amtliche Flurstücke, Daten für Bundesbehörden und Nutzungsberechtigte nach V GeoBund | Kein allgemein freier Weiterverwendungsnachweis für dieses Produkt; kostenlose Bereitstellung ist keine offene Lizenz |

Es wird keine deutschlandweit vollständige physische Netzaufnahme behauptet. OSM-Objektangaben sind quellenbelegte Kartierungsangaben und nicht automatisch betreiberbestätigt. Einheiten, Spannungen, Betreiber oder freie Kapazitäten werden nicht ergänzt, wenn sie fehlen. Geometrisch abgeleitete Werte und nutzerseitige Schätzpreise bleiben separat.

## Drittlizenzen

Leaflet 1.9.4: BSD-2-Clause, Copyright Vladimir Agafonkin und Mitwirkende. Lizenztext in `dist/vendor/leaflet-LICENSE.txt`. OSM-Daten separat ODbL 1.0. Keine externen Schriften erforderlich; System-Fallbacks vorhanden.

## Bisheriger Katasteradapter NRW (Stand vor Erweiterung)

Eingebunden: [WMS NW ALKIS](https://www.wms.nrw.de/geobasis/wms_nw_alkis?SERVICE=WMS&REQUEST=GetCapabilities), Layer `adv_alkis_flurstuecke`, Stil `Grau`, ab Zoom 17, nur räumlich NRW. Am 05.10.2026 geladene Capabilities erklären Datenlizenz Deutschland Zero 2.0 und AccessConstraints NONE. Quelle Geobasis NRW wird trotzdem sichtbar genannt. Der Dienst ist nur eine amtliche Kartendarstellung; keine amtliche Geometrieübernahme und kein Eigentumsnachweis. Einzelobjekt-Datenstand bleibt ungeprüft (wäre über GetFeatureInfo abrufbar). Koordinatentransformation EPSG:3857 ist keine amtliche Koordinatenausgabe; nur EPSG:25832 ist laut Dienstbeschreibung amtlich. Der Export enthält eine schematische OSM-Karte und eigene Flächenskizze, keine NRW-WMS-Kachel.


## Bundesländer-Aufteilung (08.10.2026)

Landesgrenzen: OSM-Relationen mit `admin_level=4` und `ISO3166-2=DE-*`, extrahiert aus demselben lokalen Geofabrik-PBF (Snapshot 03.10.2026). Die 16 Relations-IDs sind in `data/states.json` dokumentiert. Darstellung mit 0,003° Toleranz vereinfacht; Zuordnung der Infrastruktur erfolgt anhand der unvereinfachten Geometrien. Unveränderte OSM-Objekte und vollständige Leitungsverläufe, keine abgeschnittenen Grenzleitungen. Quellenangabe und Lizenz bleiben © OpenStreetMap-Mitwirkende / ODbL 1.0. Keine amtlichen Landes- oder Grundstücksgrenzen.

## Flurstückskarten aller Bundesländer – geprüft 08.10.2026

Alle aufgeführten Dienste wurden per GetCapabilities sowie mit echten GetMap-Bildern in EPSG:3857 geprüft. Layer, Stil, WMS-Version, Gebiet und Teststandort stehen in `data/parcel-services.json`. Der fachliche Datenstand wird vom jeweiligen Anbieter bestimmt; das Prüfdatum ist kein Aktualitätsdatum aller Flurstücke.

| Bundesland | Amtlicher Dienst / Quellenvermerk | Lizenz / Nutzungsrahmen | Einschränkung |
|---|---|---|---|
| Baden-Württemberg | [LGL-BW (2026)](https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_ALKIS_Basis_Vertrieb?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Liegenschaftskarte einschließlich weiterer Katasterinhalte. |
| Bayern | [Bayerische Vermessungsverwaltung](https://geoservices.bayern.de/od/wms/alkis/v1/parzellarkarte?SERVICE=WMS&REQUEST=GetCapabilities) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Parzellarkarte ohne Flurstücksnummern. |
| Berlin | [Geoportal Berlin / SenStadt](https://gdi.berlin.de/services/wms/alkis_flurstuecke?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/zero-2-0](https://www.govdata.de/dl-de/zero-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Brandenburg | [GeoBasis-DE/LGB](https://isk.geobasis-bb.de/ows/alkis_wms?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Bremen | [Landesamt GeoInformation Bremen](https://geodienste.bremen.de/wms_flurstuecke?SERVICE=WMS&REQUEST=GetCapabilities) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Kartendarstellung; keine Eigentümerdaten |
| Hamburg | [Freie und Hansestadt Hamburg, Landesbetrieb Geoinformation und Vermessung](https://geodienste.hamburg.de/HH_WMS_INSPIRE_Flurstuecke?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Hessen | [Hessische Verwaltung für Bodenmanagement und Geoinformation](https://inspire-hessen.de/ows/services/org.2.07247d95-adc7-4c7d-9c7a-ed17af855317_wms?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/zero-2-0](https://www.govdata.de/dl-de/zero-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Mecklenburg-Vorpommern | [GeoBasis-DE/M-V 2026](https://www.geodaten-mv.de/dienste/inspire_cp_alkis_view?SERVICE=WMS&REQUEST=GetCapabilities) | [Nutzungsbedingungen M-V](https://www.geoportal-mv.de/portal/Geowebdienste/INSPIRE-Themen/Flurstuecke_Grundstuecke) | Kartendarstellung; keine Eigentümerdaten |
| Niedersachsen | [LGLN (2026)](https://www.inspire.niedersachsen.de/doorman/noauth/alkis-vs-cp?SERVICE=WMS&REQUEST=GetCapabilities) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Kartendarstellung; keine Eigentümerdaten |
| Nordrhein-Westfalen | [Geobasis NRW](https://www.wms.nrw.de/geobasis/wms_nw_alkis?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/zero-2-0](https://www.govdata.de/dl-de/zero-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Rheinland-Pfalz | [GeoBasis-DE / LVermGeoRP (2026)](https://www.geoportal.rlp.de/mapbender/php/wms.php?inspire=1&layer_id=61688&withChilds=1&SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Liegenschaftskarte einschließlich weiterer Katasterinhalte. |
| Saarland | [GeoBasis DE/LVGL-SL (2026)](https://geoportal.saarland.de/mapbender/php/wms.php?inspire=1&layer_id=42092&withChilds=1&SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Sachsen | [GeoSN](https://geodienste.sachsen.de/wms_geosn_flurstuecke/guest?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Sachsen-Anhalt | [GeoBasis-DE / LVermGeo ST](https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_CP_WMS?SERVICE=WMS&REQUEST=GetCapabilities) | [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) | Kartendarstellung; keine Eigentümerdaten |
| Schleswig-Holstein | [GeoBasis-DE/LVermGeo SH](https://service.gdi-sh.de/SH_INSPIREVIEW_AI_CP_ALKIS?SERVICE=WMS&REQUEST=GetCapabilities) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Kartendarstellung; keine Eigentümerdaten |
| Thüringen | [GDI-Th](https://www.geoproxy.geoportal-th.de/geoproxy/services/ALKISKOMPAKT?SERVICE=WMS&REQUEST=GetCapabilities) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Kartendarstellung; keine Eigentümerdaten |

Sachsen-Anhalt: INSPIRE-Flurstücke sind im amtlichen Open-Data-Angebot aufgeführt; die [Nutzungsbedingungen, Abschnitt 2](https://www.lvermgeo.sachsen-anhalt.de/de/nutzungsbedingungen.html) erlauben offene Daten unter dl-de/by-2-0 mit Quellenvermerk © GeoBasis-DE / LVermGeo ST. Für Mecklenburg-Vorpommern wird der im Dienst geforderte Quellenvermerk © GeoBasis-DE/M-V 2026 geführt. Rheinland-Pfalz und Saarland verwenden die in den Capabilities angegebenen GetMap-Endpunkte, nicht die nur für Metadaten vorgesehenen Katalogadressen.
