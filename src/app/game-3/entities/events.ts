export interface GameEventMap {
  GAME_STARTED: { time: number };
  GAME_PAUSED: { paused: boolean };
  GAME_OVER: { score: number; reason: string };
  SCORE_CHANGED: { score: number; coins: number; combo: number };
  PLAYER_CRASHED: { cause: string };
  PLAYER_MOUNTED: { kind: string };
  GAME_RESTARTED: void;
}

export type GameEventName = keyof GameEventMap;

export const GAME_EVENTS_KEY = 'game-3-events';

export type RawListener = (payload: unknown) => void;
