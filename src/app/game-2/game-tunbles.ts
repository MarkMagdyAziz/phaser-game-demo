export interface LevelConfig {
  timeSeconds: number;
  starsRequired: number;
  spawnInitialBomb: boolean;
  bombIntervalMs: number;
}

export const LEVELS: LevelConfig[] = [
  { timeSeconds: 60, starsRequired: 12, spawnInitialBomb: false, bombIntervalMs: 0 },
  { timeSeconds: 60, starsRequired: 12, spawnInitialBomb: true, bombIntervalMs: 5000 },
  { timeSeconds: 45, starsRequired: 12, spawnInitialBomb: true, bombIntervalMs: 5000 },
  { timeSeconds: 45, starsRequired: 16, spawnInitialBomb: true, bombIntervalMs: 5000 },
];

// Camera / world
export const WORLD_WIDTH = 2400;
export const CAMERA_LERP_X = 0.1;
export const CAMERA_LERP_Y = 0.15;
export const CAMERA_DEADZONE_W = 160;
export const CAMERA_DEADZONE_H = 80;

// Gameplay tunables
export const PLAYER_MOVE_VELOCITY = 160;
export const PLAYER_JUMP_VELOCITY = -330;
export const PLAYER_BOUNCE = 0.4;
export const STAR_VALUE = 10;
export const STAR_COUNT = 12;
export const TIME_BONUS_PER_SECOND = 5;
export const BOMB_SPAWN_Y = 16;
