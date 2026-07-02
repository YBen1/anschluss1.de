# anschluss1.de — TA Mittelspannung Berlin 2025, interaktiv

Eine einzelne, in sich geschlossene Lernseite (`index.html`, kein Build-Step,
CSS/JS vollständig inline) zu den **Technischen Anforderungen für den Anschluss
an das Mittelspannungsnetz Berlin** (TA Mittelspannung, Ausgabe 2025,
Stromnetz Berlin GmbH, gültig ab 01.07.2025).

Didaktisch aufbereitet im Stil eines Distill.pub-Artikels: interaktives
SVG-Netzdiagramm der drei Anschlusskonzepte (offener Ring / geschlossener Ring /
Stich) mit schrittweiser Fehlersimulation und Eigentumsgrenzen,
Entscheidungs-Assistent „Welcher Anschluss passt?", synoptische
Vergleichsmatrix, Faktenkacheln, Abkürzungs-Tooltips, interaktive Checkliste
„Baulicher Teil", Karteikarten-Deck und ein Abschluss-Quiz. Helles und dunkles
Farbschema (folgt dem System, manuell umschaltbar); Konzept-Tabs sind per
`#offener-ring` / `#geschlossener-ring` / `#stich` direkt verlinkbar.

> **Hinweis:** Inoffizielle Lernhilfe. Im Zweifel gelten ausschließlich die
> Originaldokumente von Stromnetz Berlin.

## Aufbau

- `index.html` — die komplette Seite, alles inline, keine Abhängigkeiten.
- `og-image.png` — Social-Preview-Bild (1200×630) für Open Graph/Twitter-Cards.
- `robots.txt` — erlaubt Indexierung.
- `vercel.json` — statisches Deployment ohne Build plus Security-/Cache-Header.
- `sources/` — die verwendeten Original-PDFs, extrahierter Text (`sources/text/`)
  und gerenderte Bilder (`sources/png/`); dienen nur als Quellennachweis und sind
  per `.vercelignore` vom Deployment ausgeschlossen.

## Deployment

Statische Seite ohne Build-Step. Es genügt, `index.html` aus dem Repo-Root zu
servieren. Ausgeliefert über Vercel auf https://anschluss1.de.

## Quellen

Stromnetz Berlin GmbH — TA Mittelspannung, Ausgabe 2025, inklusive der Anlagen
1, 2, 4 und 6 sowie der Übersichtsschaltbilder (Bilder 1.1–1.11). Sämtliche
Original-PDFs sind im Footer der Seite verlinkt.
