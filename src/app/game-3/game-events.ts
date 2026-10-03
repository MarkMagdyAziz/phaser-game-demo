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

type RawListener = (payload: unknown) => void;

export class GameEventBus {
  private readonly listeners = new Map<GameEventName, Set<RawListener>>();

  on<K extends GameEventName>(event: K, listener: (payload: GameEventMap[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set<RawListener>();
      this.listeners.set(event, set);
    }
    const target = set;
    const raw = listener as RawListener;
    target.add(raw);
    return () => {
      target.delete(raw);
    };
  }

  emit<K extends GameEventName>(event: K, payload?: GameEventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}
