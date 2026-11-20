# Sunset Panels — GTA-Style Cover Art Maker

![Competition badge](https://make.fun/badge/gta6-cover-art-01.svg)
![Rank badge](https://make.fun/badge/gta6-cover-art-01/imgans322-gif/gta6-cover-art-01/rank.svg)
![Reward badge](https://make.fun/badge/gta6-cover-art-01/imgans322-gif/gta6-cover-art-01/reward.svg)

Bounty: [Make GTA 6 Cover Art — gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01)

Sunset Panels turns your own photos into bold, multi-panel poster cover art:
six angled panels with hard clip-path cuts, a Vice City sunset / neon colour
grade, and big poster lettering for your caption — exported as a real PNG in
the sizes people actually post.

## How to use it

1. Open the app (serve `app/` with any static file server, e.g. `node serve.ts`,
   then visit http://localhost:8080).
2. Load a photo — one photo can stretch across all six panels, or switch to
   “different photo per panel” and fill each panel separately. Photos are read
   locally on your machine and are never uploaded.
3. Click a panel to select it, drag its photo to reposition it, scroll over a
   panel (or use the sliders) to zoom, and nudge it left/right and up/down.
4. Type your caption, tune the sunset/neon grade and the caption size.
5. Pick an export size — **1080 × 1080**, **1080 × 1350** or **1920 × 1080** —
   and press **Export PNG**. The PNG is drawn on canvas from the same panel
   geometry, transforms, grade and caption as the live preview.

The app is fully static and offline: every script, style and sample image it
loads lives under `app/`, and it makes no network requests.

Original work only: no Rockstar logos, wordmarks, artwork, characters or font
files. Lettering uses system fonts styled with CSS/canvas effects.

## Layout of this repository

- `app/` — the web app (`index.html`, `style.css`, `src/main.js`,
  `src/panels.js`, `src/exporter.js`, plus two kit sample photos in
  `app/samples/`)
- `screenshots/` — three screenshots taken with the app itself
- `main.ts` — the make.fun hand-in program; copies `app/` and `screenshots/`
  to the output directory and writes `dossier.json`
- `serve.ts` — a tiny local static server for trying the app
- `vendor/makefun-app.ts` — the unmodified make.fun dossier library

## Screenshots

`?shot=cover&photo=pier&caption=Sunset%20Heist` renders a finished cover
full-screen, and `?shot=editor&photo=boulevard&caption=Boulevard%20Queen`
opens the editor with that sample photo and caption loaded (see `shots.json`).
