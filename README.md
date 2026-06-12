# DBD Perk Slot Machine

A [Dead by Daylight](https://deadbydaylight.com) perk randomizer. Live at [dpsm.3stadt.com](https://dpsm.3stadt.com).

## Prerequisites

- Node.js 22+
- [TexturePacker](https://www.codeandweb.com/texturepacker) — only needed when adding or updating perk icons

## Local Development

```sh
npm install
npm run dev      # dev server at http://localhost:8080
npm run build    # production build → dist/
```

## Adding a Perk

1. **Add the icon** — drop a 256×256 PNG into the relevant source folder:

   | Folder | Use |
   |--------|-----|
   | `assets/iconsourceKill/` | Killer perk, default style |
   | `assets/iconsourceKillColor/` | Killer perk, colored style |
   | `assets/iconsourceSurv/` | Survivor perk, default style |
   | `assets/iconsourceSurvColor/` | Survivor perk, colored style |

   The filename becomes the perk key (e.g. `142_myNewPerk.png` → key `142_myNewPerk`). Use a numeric prefix to keep the list ordered.

2. **Regenerate the sprite atlases** — run TexturePacker for every `.tps` file in `assets/`:

   ```sh
   for f in assets/*.tps; do TexturePacker "$f"; done
   ```

   This updates the JSON atlases and PNG sheets in `public/sprites/`.

3. **Fix the CSS** — TexturePacker emits class names that start with a digit, which is invalid CSS. After regenerating, open `public/sprites/kill-css.css` and `surv-css.css` and apply this regex replace (VSCode Find & Replace with regex enabled):

   - Find: `\n\.([\d]+)_`
   - Replace: `\n._$1_`

4. **Add the perk name** — in every locale file under `src/locales/`, add an entry under `perks.killer` or `perks.survivor` using the key from step 1:

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
| `kids` | `kids=01_agitation,02_bamboozle` | Comma-separated active killer perk keys |
| `sids` | `sids=00_adreneline` | Comma-separated active survivor perk keys |
| `color` | `color=1` | Use colored perk icons |
| `streammode` | `streammode=1` | Hide UI chrome for OBS/XSplit overlays |
| `autostart` | `autostart=1000` | Auto-roll N milliseconds after page load |
| `orientation` | `orientation=portrait` | Force 2×2 portrait layout |

## Tech Stack

Vue 3, Vite, vue-router 4, vue-i18n 10. The slot reel is rendered via plain Canvas 2D using a TexturePacker JSON atlas. Deployed to Netlify; configuration is in `netlify.toml`.
