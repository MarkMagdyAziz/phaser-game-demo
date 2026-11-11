export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// World / camera (endless: huge width, bounded height)
export const WORLD_HEIGHT = 900;
export const ENDLESS_WIDTH = 20_000_000;
export const CAMERA_LERP_X = 0.1;
export const CAMERA_LERP_Y = 0.15;
export const CAMERA_DEADZONE_W = 140;
export const CAMERA_DEADZONE_H = 90;

// Terrain streaming chunks (Phase 4)
export const CHUNK_WIDTH = 800;
export const CHUNK_KEEP_BEHIND = 1;
export const CHUNK_LOOK_AHEAD = 1;

// Player (Arcade Physics)
export const PLAYER_SPAWN_X = 260;
export const PLAYER_MOVE_VELOCITY = 240;
export const PLAYER_JUMP_VELOCITY = -420;
export const PLAYER_SCALE = 0.62; // trimmed 84x98 frame -> ~52x61 on screen

// Sprite display scales for the remaining curated art. The source PNGs are
// alpha-trimmed by art-source/tools/curate-game3-assets.ps1, so these are the
// only size knobs.
export const OBSTACLE_SCALE = 0.55; // 41x268 tree -> ~23x147
export const COIN_SCALE = 0.8; // 38x40 -> ~30x32
export const WOLF_SCALE = 1;

// Player state machine
export const WOLF_RIDE_DISTANCE = 6000; // px a mount lasts before the wolf bolts

// Terrain contour (decision D7: surface-based procedural downhill rollers)
// Tuned for a smooth, icy glide: long swells and almost no chop. Max slope is
// ~6 degrees, ~8 at full difficulty (it was ~28/41 with the old values).
export const SURFACE_MID_Y = 360;
export const SURFACE_AMP_LARGE = 50;
export const SURFACE_PERIOD_LARGE = 3600;
export const SURFACE_AMP_SMALL = 6;
export const SURFACE_PERIOD_SMALL = 1800;
// export const SURFACE_AMP_LARGE = 90;
// export const SURFACE_PERIOD_LARGE = 2400;
// export const SURFACE_AMP_SMALL = 34;
// export const SURFACE_PERIOD_SMALL = 700;
export const SURFACE_SAMPLE_STEP = 12;
export const SURFACE_TOLERANCE = 2;

// Terrain rendering (decision D13: Kenney snow crust stamped over a solid fill)
export const SURFACE_COLOR = 0xc9d3da; // packed-snow Graphics body under the crust tiles
export const SURFACE_LINE_COLOR = 0xf2f8fc; // icy highlight along the contour
export const TERRAIN_CRUST_STEP = 20; // horizontal spacing between crust tiles
export const TERRAIN_FILL_DEPTH = 0;
export const TERRAIN_CRUST_DEPTH = 1;

// Skiing feel
// Baseline forward speed with no steering. Higher values read as skating; the
// player can still steer against it, so it is a push, not a floor.
export const DOWNHILL_PUSH = 140;

// Left arrow brakes, never reverses. The world starts at x = 0 and only positive
// chunks are generated, so a negative velocity just parks the player against the
// left wall ("running" in place). Steering is therefore floored at a slow glide.
export const MIN_FORWARD_SPEED = 40;

// The sprite no longer rotates, so there is no spin, flip counting or
// landing-alignment check. Air time is still scored.
export const CRASH_TINT = 0xef4444;

// Phase 6 — obstacles
export const OBSTACLE_SLOT_WIDTH = 240;
export const OBSTACLE_DENSITY = 0.1;
export const OBSTACLE_KEEP_BEHIND_SLOTS = 3;
export const OBSTACLE_LOOK_AHEAD_SLOTS = 3;
export const PLAYER_RAMP_LAUNCH_VELOCITY = -520;

// Phase 7 — rideable animals
export const ANIMAL_SLOT_WIDTH = 900;
export const ANIMAL_DENSITY = 0.35;
export const ANIMAL_KEEP_BEHIND_SLOTS = 1;
export const ANIMAL_LOOK_AHEAD_SLOTS = 2;

// Phase 8 — coins
export const COIN_SLOT_WIDTH = 200;
export const COIN_DENSITY = 0.3;
export const COIN_KEEP_BEHIND_SLOTS = 2;
export const COIN_LOOK_AHEAD_SLOTS = 3;
export const COIN_SURFACE_OFFSET = 34; // half the scaled coin height + a gap

// Phase 8 — score + combo
export const DISTANCE_POINTS_PER_PX = 0.1;
export const COIN_POINTS = 10;
export const AIR_TIME_POINTS_PER_SEC = 5;
export const LANDING_POINTS = 20;
export const COMBO_STEP = 0.2;
export const COMBO_MAX_MULTIPLIER = 5;

// Phase 9 — difficulty scaling (all bonuses are the value reached at 100% progress)
export const DIFFICULTY_RAMP_DISTANCE = 30000;
export const DIFFICULTY_OBSTACLE_BONUS = 0.12;
export const DIFFICULTY_ANIMAL_BONUS = 0.1;
export const DIFFICULTY_SPEED_BONUS = 0.5;
export const DIFFICULTY_TERRAIN_BONUS = 0.6;

// Phase 10 — parallax background (screen-space scroll multipliers)
export const BG_PARALLAX_CLOUD = 0.04;
export const BG_PARALLAX_FAR = 0.08;
export const BG_PARALLAX_MID = 0.2;
export const BG_PARALLAX_FOREGROUND = 1.3;

// Background band placement. Each layer is a cropped, opaque scenery band, so
// these Y values decide how much of each peeks above the snow line. The terrain
// surface ranges 236..484 in world space, so bands sit high on screen and are
// occluded as the slope rises.
export const BG_CLOUD_Y = 40;
export const BG_CLOUD_ALPHA = 0.85;
export const BG_FAR_Y = 150;
export const BG_MID_Y = 250;
export const BG_SNOW_ALPHA = 0.95;

// Phase 11 — particles / effects
export const EFFECT_SNOWFALL_FREQUENCY = 90;
export const EFFECT_TRAIL_FREQUENCY = 50;
export const EFFECT_LANDING_PARTICLES = 10;
export const EFFECT_JUMP_PARTICLES = 7;
export const EFFECT_CRASH_PARTICLES = 18;
export const EFFECT_COIN_PARTICLES = 7;

// Phase 12 — audio volumes
export const AUDIO_VOLUME_AMBIENT = 0.22;
export const AUDIO_VOLUME_SKI = 0.18;
export const AUDIO_VOLUME_SFX = 0.5;

// Phase 13 — Angular event bridge (emit SCORE_CHANGED per this score step, not per frame)
export const SCORE_EVENT_STEP = 25;

// Phase 14 — touch controls
export const TOUCH_BUTTON_RADIUS = 42;
export const TOUCH_SWIPE_JUMP_DISTANCE = 60;

// Rideable wolf. No Kenney pack ships a wolf, so BootScene paints it with the
// graphics API at this size (decision D10). AnimalSystem must agree.
export const WOLF_TEXTURE_WIDTH = 110;
export const WOLF_TEXTURE_HEIGHT = 80;

// HUD / overlay chrome
export const HUD_PANEL_WIDTH = 232;
export const HUD_PANEL_HEIGHT = 52;
export const HUD_TEXT_SIZE = 16;
export const HUD_MUTED_TEXT_SIZE = 12;
export const OVERLAY_TEXT_SIZE = 22;
