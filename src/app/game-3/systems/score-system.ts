import {
  AIR_TIME_POINTS_PER_SEC,
  COIN_POINTS,
  DISTANCE_POINTS_PER_PX,
  LANDING_POINTS,
} from '../game-tunbles';
import { ComboSystem } from './combo-system';

export interface LandingResult {
  airTimeSeconds: number;
}

export class ScoreSystem {
  private distance = 0;
  private coins = 0;
  private airTime = 0;
  private landings = 0;
  private readonly combo = new ComboSystem();

  addDistance(deltaX: number): void {
    if (deltaX > 0) {
      this.distance += deltaX;
    }
  }

  addCoins(count = 1): void {
    this.coins += count;
  }

  registerLanding(result: LandingResult): void {
    this.airTime += result.airTimeSeconds;
    this.landings += 1;
    this.combo.registerSuccess();
  }

  get collectedCoins(): number {
    return this.coins;
  }

  get comboMultiplier(): number {
    return this.combo.multiplier;
  }

  get total(): number {
    const base =
      this.distance * DISTANCE_POINTS_PER_PX +
      this.coins * COIN_POINTS +
      this.airTime * AIR_TIME_POINTS_PER_SEC +
      this.landings * LANDING_POINTS;
    return Math.round(base * this.comboMultiplier);
  }
}
