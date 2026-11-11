/**
 * Central registry of every texture key game-3 uses (agent rule 15).
 *
 * Nothing outside this file may hardcode a loader key. File paths and Arcade
 * bodies live in `asset-specs.ts`, keyed by these values.
 *
 * Every key here has exactly one curated PNG under public/assets/game-3 (see
 * art-source/tools/curate-game3-assets.ps1). The one exception is `wolf`, which
 * BootScene paints with the graphics API.
 */
export const ASSET_KEYS = {
  // Player frames. Only three poses are needed: the crouch doubles as the
  // riding pose, plus airborne and crash. All share one 84x98 canvas, so a
  // single body fits every frame and swapping texture never disturbs it.
  //
  // The Kenney "climb" frames are deliberately NOT shipped: alternating them is
  // a walk cycle, which read as the character marching instead of skiing.
  skierRide: 'skier-ride',
  skierAir: 'skier-air',
  skierCrash: 'skier-crash',

  // Terrain tiles. The solid snow body under the crust is a Graphics polygon,
  // so only the crust band and the foreground strip need artwork.
  terrainCrust: 'terrain-crust',
  terrainCrustLeft: 'terrain-crust-left',
  terrainCrustRight: 'terrain-crust-right',
  terrainStrip: 'terrain-strip',

  // Obstacles.
  treeSnow: 'obstacle-tree-snow',
  treeBare: 'obstacle-tree-bare',
  rock: 'obstacle-rock',
  snowDrift: 'obstacle-snow-drift',
  snowBush: 'obstacle-snow-bush',
  ramp: 'obstacle-ramp',

  // Rideable animal. Drawn at runtime, not loaded from a file.
  wolf: 'animal-wolf',

  // Collectible.
  coin: 'coin-gold',

  // Parallax background. Each is a cropped, opaque scenery band; the sky tile
  // fills the screen behind them.
  bgSky: 'bg-sky',
  bgClouds: 'bg-clouds',
  bgTreesFar: 'bg-trees-far',
  bgTreesNear: 'bg-trees-near',

  // Particle textures.
  particleSnow: 'particle-snow',
  particleStar: 'particle-star',
  particleSmoke: 'particle-smoke',

  // UI chrome. panel/round are 64x64, which nine-slices cleanly.
  uiPanelDark: 'ui-panel-dark',
  uiRound: 'ui-round',
  uiBanner: 'ui-banner',
} as const;

/**
 * Keys BootScene paints with the graphics API instead of loading from disk.
 * No Kenney pack ships a wolf, so it is drawn as original art (decision D10)
 * and recorded as such in ASSETS.md.
 */
export const BOOT_DRAWN_KEYS: readonly string[] = [ASSET_KEYS.wolf];

/**
 * CSS family names registered by the @font-face rules in src/styles.css.
 * PreloadScene awaits document.fonts.load() for these so Phaser Text never
 * paints in a fallback face.
 */
export const FONT_FAMILIES = {
  future: 'Kenney Future',
  blocks: 'Kenney Blocks',
  pixel: 'Kenney Pixel',
} as const;
