# Asset and License Manifest — game-3

Every art asset that `src/app/game-3` loads at runtime is listed here, with its
origin and licence. The game's own source is the authoritative list of _which_
files exist; `src/app/game-3/entities/asset-keys.ts` is the single registry of
texture keys and `src/app/game-3/asset-specs.ts` maps each key to exactly one
file (enforced 1:1 — no orphans, no unused files).

## Summary

| Category               | Count            | Source                                      | Licence                         |
| ---------------------- | ---------------- | ------------------------------------------- | ------------------------------- |
| Player frames          | 3 PNG            | Kenney — New Platformer Pack                | CC0 1.0                         |
| Terrain tiles          | 5 PNG            | Kenney — New Platformer Pack                | CC0 1.0                         |
| Obstacles              | 5 PNG            | Kenney — Foliage Pack + New Platformer Pack | CC0 1.0                         |
| Collectible            | 1 PNG            | Kenney — New Platformer Pack                | CC0 1.0                         |
| Backgrounds            | 4 PNG            | Kenney — New Platformer Pack                | CC0 1.0                         |
| Particles              | 3 PNG            | Kenney — Particle Pack                      | CC0 1.0                         |
| UI chrome              | 3 PNG            | Kenney — UI Pack                            | CC0 1.0                         |
| Fonts                  | 3 TTF            | Kenney — Font Pack                          | CC0 1.0                         |
| Wolf (rideable animal) | drawn at runtime | Original work — this project                | Original, no third-party rights |

Total: **27 files**, all under `public/assets/game-3/`.

## Source packs

| Pack                    | Author | Licence | URL                                          |
| ----------------------- | ------ | ------- | -------------------------------------------- |
| New Platformer Pack 1.1 | Kenney | CC0 1.0 | https://kenney.nl/assets/new-platformer-pack |
| Foliage Pack            | Kenney | CC0 1.0 | https://kenney.nl/assets/foliage-pack        |
| Particle Pack           | Kenney | CC0 1.0 | https://kenney.nl/assets/particle-pack       |
| UI Pack                 | Kenney | CC0 1.0 | https://kenney.nl/assets/ui-pack             |
| Font Pack               | Kenney | CC0 1.0 | https://kenney.nl/assets/font-pack           |

CC0 (Public Domain Dedication) requires no attribution, but Kenney asks that his
work be credited, so it is recorded here.

## Player frames — `public/assets/game-3/player/`

All three frames come from the beige character in the New Platformer Pack and are
alpha-trimmed then padded onto one shared **84x98** canvas, so a single Arcade
body and origin fit every frame and swapping texture cannot change collision.
The pad is transparent.

Only three poses are shipped. The `character_beige_front` and
`character_beige_climb_a/b` frames were **dropped**: the climb pair is a
two-frame walk cycle, and alternating it made the character march in place
instead of ski. The crouch (`duck`) now serves as the riding pose.

| File                     | Texture key   | Original source file                                  | Used for                    |
| ------------------------ | ------------- | ----------------------------------------------------- | --------------------------- |
| `player/skier_ride.png`  | `skier-ride`  | `Sprites/Characters/Default/character_beige_duck.png` | Riding pose (static crouch) |
| `player/skier_air.png`   | `skier-air`   | `Sprites/Characters/Default/character_beige_jump.png` | Airborne                    |
| `player/skier_crash.png` | `skier-crash` | `Sprites/Characters/Default/character_beige_hit.png`  | Game over                   |

## Terrain — `public/assets/game-3/terrain/`

The solid packed-snow body under the surface is a `Graphics` polygon tinted
`SURFACE_COLOR`, so only the crust band and the foreground strip are artwork.

| File                           | Texture key           | Original source file                                       | Used for                                        |
| ------------------------------ | --------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| `terrain/snow_crust.png`       | `terrain-crust`       | `Sprites/Tiles/Default/terrain_snow_cloud_middle.png`      | Repeating crust tile stamped along the contour  |
| `terrain/snow_crust_left.png`  | `terrain-crust-left`  | `Sprites/Tiles/Default/terrain_snow_cloud_left.png`        | Contour cap, left edge of a chunk               |
| `terrain/snow_crust_right.png` | `terrain-crust-right` | `Sprites/Tiles/Default/terrain_snow_cloud_right.png`       | Contour cap, right edge of a chunk              |
| `terrain/snow_strip.png`       | `terrain-strip`       | `Sprites/Tiles/Default/terrain_snow_horizontal_middle.png` | Foreground snow lip at the bottom of the screen |
| `terrain/ramp.png`             | `obstacle-ramp`       | `Sprites/Tiles/Default/terrain_snow_ramp_short_a.png`      | Side ramp (non-lethal, gives air)               |

## Obstacles — `public/assets/game-3/obstacles/`

`foliagePack_025` and `foliagePack_026` are the same bare-tree silhouette in two
colourways: 026 (`#E9D5B7` cream) reads as a snow-covered tree and 025 (`#BD8958`
brown) as a bare trunk, which is what a winter slope actually looks like.
`foliagePack_012`/`013` are autumn canopies (`#D78100`) and were rejected.

Trees carry a trunk-sized Arcade body (`TRUNK_BODY` in `asset-specs.ts`) so a
wide canopy still reads as a narrow, dodgeable trunk.

| File                      | Texture key           | Original source file                   | Used for          |
| ------------------------- | --------------------- | -------------------------------------- | ----------------- |
| `obstacles/tree_snow.png` | `obstacle-tree-snow`  | `PNG/Default size/foliagePack_026.png` | Snow-covered tree |
| `obstacles/tree_bare.png` | `obstacle-tree-bare`  | `PNG/Default size/foliagePack_025.png` | Bare tree         |
| `obstacles/rock.png`      | `obstacle-rock`       | `Sprites/Tiles/Default/rock.png`       | Rock outcrop      |
| `obstacles/snowdrift.png` | `obstacle-snow-drift` | `Sprites/Tiles/Default/snow.png`       | Low snow drift    |
| `obstacles/snowbush.png`  | `obstacle-snow-bush`  | `Sprites/Tiles/Default/bush.png`       | Snowy bush        |

## Collectible — `public/assets/game-3/collectibles/`

| File                         | Texture key | Original source file                  | Used for         |
| ---------------------------- | ----------- | ------------------------------------- | ---------------- |
| `collectibles/coin_gold.png` | `coin-gold` | `Sprites/Tiles/Default/coin_gold.png` | Collectible coin |

## Backgrounds — `public/assets/game-3/background/`

Kenney's `background_*.png` files are **opaque 256x256 scenes** (flat sky on
top, scenery below, horizontally tileable), not transparent layers. Stacking
them whole would hide each other, so each is cropped to just its scenery band.
Every band is fully opaque edge-to-edge, so no colour keying is needed and the
sky stays visible above each layer.

| File                        | Texture key     | Original source file                                     | Crop         | Used for                       |
| --------------------------- | --------------- | -------------------------------------------------------- | ------------ | ------------------------------ |
| `background/sky.png`        | `bg-sky`        | `Sprites/Backgrounds/Default/background_solid_sky.png`   | full 256x256 | Flat sky behind everything     |
| `background/clouds.png`     | `bg-clouds`     | `Sprites/Backgrounds/Default/background_clouds.png`      | rows 110–256 | Cloud band, slowest parallax   |
| `background/trees_far.png`  | `bg-trees-far`  | `Sprites/Backgrounds/Default/background_fade_trees.png`  | rows 80–256  | Faded distant treeline         |
| `background/trees_near.png` | `bg-trees-near` | `Sprites/Backgrounds/Default/background_color_trees.png` | rows 80–176  | Near treeline, faster parallax |

## Particles — `public/assets/game-3/effects/`

Kenney's particle sheets are ~512x512 canvases holding a small shape; each is
alpha-trimmed and downscaled. One texture per effect, no duplicates.

| File                         | Texture key      | Original source file              | Used for                                        |
| ---------------------------- | ---------------- | --------------------------------- | ----------------------------------------------- |
| `effects/particle_snow.png`  | `particle-snow`  | `PNG (Transparent)/circle_02.png` | Ambient snowfall, ski trail, landing/jump puffs |
| `effects/particle_star.png`  | `particle-star`  | `PNG (Transparent)/star_01.png`   | Coin pickup sparkle                             |
| `effects/particle_smoke.png` | `particle-smoke` | `PNG (Transparent)/smoke_04.png`  | Crash puff                                      |

## UI chrome — `public/assets/game-3/ui/`

`panel_dark` and `round` are 64x64, which nine-slices cleanly.

| File                | Texture key     | Original source file              | Used for                |
| ------------------- | --------------- | --------------------------------- | ----------------------- |
| `ui/panel_dark.png` | `ui-panel-dark` | `PNG/Default/panel_grey_dark.png` | HUD panel (nine-slice)  |
| `ui/round.png`      | `ui-round`      | `PNG/Default/round_grey.png`      | On-screen touch buttons |
| `ui/banner.png`     | `ui-banner`     | `PNG/Default/banner_modern.png`   | Game-over title banner  |

## Fonts — `public/assets/game-3/fonts/`

Copied verbatim. Registered as `@font-face` in `src/styles.css` under the family
names in `FONT_FAMILIES`; `PreloadScene` awaits `document.fonts.load()` so text
never paints in a fallback face.

| File                      | CSS family      | Used for                                 |
| ------------------------- | --------------- | ---------------------------------------- |
| `fonts/Kenney Future.ttf` | `Kenney Future` | HUD, score, game-over text, touch labels |
| `fonts/Kenney Blocks.ttf` | `Kenney Blocks` | Reserved for headings                    |
| `fonts/Kenney Pixel.ttf`  | `Kenney Pixel`  | Small muted HUD line (FPS/state)         |

## Original art — not from a pack

| Asset                 | Origin                                                                                 | Licence                     | Notes                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `animal-wolf` texture | Drawn at runtime in `src/app/game-3/scenes/boot.scene.ts` with the Phaser Graphics API | Original work, this project | No Kenney pack ships a wolf. Generated into a `WOLF_TEXTURE_WIDTH`x`WOLF_TEXTURE_HEIGHT` texture at boot, so no file is committed and no third-party rights are involved. |

## Audio

`public/sounds/` is unchanged by this work and is not listed here. Those files
were already curated and wired before the art pass; see the repository history
for their provenance.

## Regenerating the curated set

`art-source/tools/curate-game3-assets.ps1` performs the trim / pad / band-crop
steps listed above. The raw Kenney extracts are **not** committed
(`art-source/kenney/` is git-ignored, ~25 MB of mostly-unused art). To change
which art is used:

1. Download the CC0 packs from the URLs above.
2. Extract them so their contents sit under `art-source/kenney/`
   (`Sprites/`, `PNG/`, `PNG (Transparent)/`, `Fonts/`).
3. From the repo root:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File art-source\tools\curate-game3-assets.ps1
   ```

The script aborts with these instructions if the source folder is absent, rather
than silently emitting a partial asset tree. `art-source/tools/ascii-mask.ps1`
can be used to inspect an alpha or luminance mask when picking art
programmatically.

## Deliberately excluded

To satisfy "remove all unused assets", nothing is shipped without a consumer.
Rejected or dropped candidates:

- `terrain_snow_block_center.png` — a solid fill tile; the packed-snow body is a
  `Graphics` polygon instead.
- `spark_01.png` — no effect referenced it after the smoke/star split.
- `panel_grey.png` (light panel) — only the dark panel and round button are used.
- `foliagePack_012/013` — autumn orange canopies, wrong season.
- Kenney `Tiles/tile_0000.png`–`tile_0899.png` — 900 unnamed 21x21 tiles that
  could not be identified by inspection.
- `character_beige_front.png` and `character_beige_climb_a/b.png` — the climb
  pair is a walk cycle and made the character march; the front frame was never
  visible because the player is either riding or airborne. Only the crouch,
  jump and hit frames remain.
