# SwissBoard — Padlet für die Schweiz (lokal-first)

Eine kollaborative Board-App (Wände/Boards mit frei positionierbaren Posts),
optimiert für **Schweizer Datenschutz**. Diese Version läuft **vollständig lokal
im Browser** — **keine Firebase, kein Server, kein Cloud-Speicher**.

> 🌿 Alle Daten bleiben in Ihrem Browser (localStorage). Keine Daten verlassen das Gerät.

## Funktionen (Demo-Stand, lokal-first)

- **Dashboard:** Wände anlegen, umbenennen, löschen
- **Wand-Seite:** Posts (Text / Bild / Link) hinzufügen, frei positionieren (Drag), bearbeiten, löschen
- **Link kopieren** / **Teilen**-Aktion
- **Lokale Inhaltsmoderation** (regelbasiert, offline — keine externe KI)
- **Automatischer Demo-Login** (kein Registrier-/Login-Zwang, alles lokal)

## Technik

- Next.js 15 + Tailwind + shadcn/ui
- `output: 'export'` → statisches Build (`out/`), deploybar auf GitHub Pages / Cloudflare Pages
- Daten-Ersatz für Firestore: `src/firebase/local/` (localStorage, Firestore-kompatible API)
  → bestehende UI-Komponenten funktionieren unverändert

## Build & Deploy

```bash
npm install
npm run build        # erzeugt statisches Export unter out/
```

Deployment (Beispiel GitHub Pages):

```bash
npx gh-pages -d out -b gh-pages
```

Danach auf `https://<dein-user>.github.io/SwissBoard/` erreichbar.

## Tests

```bash
npx tsx scripts/smoke.test.ts   # validiert die lokale Datenlogik (CRUD)
```

## Roadmap

- Echte Kollaboration über ein EU-Backend (Supabase EU o. ä.) sobald Renato es bereitstellt
- Export/Import von Wänden (manueller Austausch)
