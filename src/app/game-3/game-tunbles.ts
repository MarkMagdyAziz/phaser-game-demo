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

// Player state machine
export const LANDING_LOCK_MS = 120;

// Terrain contour (decision D7: surface-based procedural downhill rollers)
export const SURFACE_MID_Y = 360;
export const SURFACE_AMP_LARGE = 90;
export const SURFACE_PERIOD_LARGE = 2400;
export const SURFACE_AMP_SMALL = 34;
export const SURFACE_PERIOD_SMALL = 700;
export const SURFACE_SAMPLE_STEP = 12;
export const SURFACE_TOLERANCE = 2;
export const SURFACE_COLOR = 0xf8fafc;
export const SURFACE_LINE_COLOR = 0x93c5fd;

// Skiing feel
export const DOWNHILL_PUSH = 55;

// Phase 5 — air tricks / landing
export const AIR_HORIZONTAL_SPEED = 150;
export const SPIN_SPEED = 7;
export const LANDING_ALIGN_TOLERANCE = 0.5;
export const CRASH_COOLDOWN_MS = 900;
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
export const COIN_SURFACE_OFFSET = 46;

// Phase 8 — score + combo
export const DISTANCE_POINTS_PER_PX = 0.1;
export const COIN_POINTS = 10;
export const AIR_TIME_POINTS_PER_SEC = 5;
export const FLIP_POINTS = 50;
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
