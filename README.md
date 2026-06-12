# DBD Perk Slot Machine

A [Dead by Daylight](https://deadbydaylight.com) perk randomizer. Live at [dpsm.3stadt.com](https://dpsm.3stadt.com).

## Prerequisites

- Node.js 22+

## Local Development

```sh
npm install
npm run dev      # dev server at http://localhost:8080
npm run build    # production build → dist/
```

The sprite sheets in `public/sprites/` are generated automatically from the
source icons before `dev`, `serve` and `build` (re-run manually with
`npm run sprites`). They are build output and not committed.

## Adding a Perk

1. **Add the icons** — drop a 256×256 PNG into both source folders for the role:

   | Folder | Use |
   |--------|-----|
   | `assets/iconsourceKill/` | Killer perk, default style |
   | `assets/iconsourceKillColor/` | Killer perk, colored style |
   | `assets/iconsourceSurv/` | Survivor perk, default style |
   | `assets/iconsourceSurvColor/` | Survivor perk, colored style |

   The filename becomes the perk key (e.g. `142_myNewPerk.png` → key `142_myNewPerk`). The numeric prefix is the perk's index: use the next free number (= the current file count of the folder), with no gaps. The default-style and colored icon must have the same filename; the sprite generator checks all of this and tells you what's wrong.

2. **Add the perk name** — in every locale file under `src/locales/`, add an entry under `perks.killer` or `perks.survivor` using the key from step 1:

   ```json
   "perks": {
     "killer": {
       "142_myNewPerk": "My New Perk"
     }
   }
   ```

## Translations

Locale files are in `src/locales/` (de, en, es, fr, ja). All UI strings live there. The `perks.*` section maps perk keys to display names shown in the roulette and config panel.

## URL Parameters

These query parameters are used for sharing and streaming:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `lang` | `lang=de` | UI language (`en`, `de`, `es`, `fr`, `ja`) |
| `kids` | `kids=1,2,17` | Comma-separated active killer perk indices (`none` disables all) |
| `sids` | `sids=0,33` | Comma-separated active survivor perk indices (`none` disables all) |
| `color` | `color=1` | Use colored perk icons |
| `streammode` | `streammode=1` | Hide UI chrome for OBS/XSplit overlays |
| `autostart` | `autostart=1000` | Auto-roll N milliseconds after page load |
| `orientation` | `orientation=portrait` | Force 2×2 portrait layout |

## Tech Stack

Vue 3, Vite, vue-router 4, vue-i18n 10. The slot reel is rendered via plain Canvas 2D using a sprite atlas; atlases, CSS sheets and the perk manifest are generated at build time by `scripts/build-sprites.mjs` (sharp). Deployed to Netlify; configuration is in `netlify.toml`.
