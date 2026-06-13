# anschluss1.de — TA Mittelspannung Berlin 2025, interaktiv

Eine einzelne, in sich geschlossene Lernseite (`index.html`, kein Build-Step,
CSS/JS vollständig inline) zu den **Technischen Anforderungen für den Anschluss
an das Mittelspannungsnetz Berlin** (TA Mittelspannung, Ausgabe 2025,
Stromnetz Berlin GmbH, gültig ab 01.07.2025).

Didaktisch aufbereitet im Stil eines Distill.pub-Artikels: interaktives
SVG-Netzdiagramm der drei Anschlusskonzepte (offener Ring / geschlossener Ring /
Stich) mit Fehlersimulation und Eigentumsgrenzen, Entscheidungs-Assistent
„Welcher Anschluss passt?", Faktenkacheln, Abkürzungs-Tooltips, interaktive
Checkliste „Baulicher Teil" und ein Abschluss-Quiz.

> **Hinweis:** Inoffizielle Lernhilfe. Im Zweifel gelten ausschließlich die
> Originaldokumente von Stromnetz Berlin.

## Aufbau

- `index.html` — die komplette Seite, alles inline, keine Abhängigkeiten.
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
