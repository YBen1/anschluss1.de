# Arbeitsstand Anschlus1

## Gesicherter Stand 05.10.2026

- Lokales Projekt: `/root/anschlus1`.
- Erste vollständig bereitgestellte private Fassung: https://anschlus1.ben-y.chatgpt.site
- Bereitgestellter Commit: `c58c48902ee6a91d1f355ade3883919e7e2d2bf9`.
- Deployment `appgdep_6ac3c47ae4848191a6e8e59d776c1d5e`: erfolgreich bestätigt.
- Netzdaten vollständig lokal extrahiert und im Quellrepository gesichert. 107.519 Stationen, 76.990 Leitungsobjekte. Datenstand 03.10.2026.
- Rechen-, Daten- und Haupt-Browserprüfungen erfolgreich; Details in VERIFICATION.md.
- Nutzerwunsch: weitere Arbeit fortsetzen und Zwischenstände regelmäßig sichern. Nach jeder zusammenhängenden Änderung folgt ein lokaler Commit; veröffentlichungsfähige Änderungen zusätzlich als neue Sites-Version.

## Zweiter gesicherter Stand

- Zusätzlicher Browsertest für Flächenzeichnung, Filter, ungültige Leistung und echte Photon-Suche: bestanden.
- Ungültige Leistungseingaben setzen vorhandene Ergebnisse und den Vergleichsspeicherknopf zurück. Änderung im Commit `04bfcd1` gesichert.
- Wiederholter vollständiger Browserablauf einschließlich Rücksetzen veralteter Ergebnisse bestanden. Neue Veröffentlichung wird aus diesem Stand erstellt; den jeweils bereitgestellten Stand zeigt Sites.

Rohdaten, Entwicklungsbrowser und Testartefakte bleiben außerhalb des veröffentlichten Datenumfangs. Die Dateien in `dist/` sind der lieferbare Stand. API-Zugangsdaten werden nicht in Dateien gespeichert.

## Korrektur des Veröffentlichungsziels

Die echte Domain www.anschluss1.de ist an Vercel und YBen1/anschluss1.de angebunden. Der Sites-Push hat diese Domain nicht aktualisiert. Der geprüfte MVP wird deshalb in einem sauberen Checkout unter /root/anschluss1-live in das bestehende Repository übernommen. Die vorherige Startseite bleibt unverändert inhaltlich unter /wissen erhalten. Sicherheitsheader werden um die tatsächlich benötigten Karten-/Suchdienste ergänzt. Die Markenbezeichnung auf der Domain lautet Anschluss1.de.

## Bundesländerkarte – 08.10.2026

Aktuelles Repository `/root/anschluss1-live`, Vercel-Ziel www.anschluss1.de. Infrastruktur nach 16 OSM-Bundesländern aufgeteilt, leichte Landesübersicht und bedarfsgesteuertes Laden implementiert. Begrenzter Dateicache, wiederverwendete Kartenobjekte, kooperatives Zeichnen, vollständige länderübergreifende 50-km-Suche, asynchroner Vergleich und Bericht. Originalbestände für Download/Validierung erhalten. Generator und Tests liegen im Repository. Daten- und Browserprüfung bestanden, Details in VERIFICATION.md.
