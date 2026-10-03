import { COMBO_MAX_MULTIPLIER, COMBO_STEP } from '../game-tunbles';

export class ComboSystem {
  private comboCount = 0;

  registerSuccess(flips: number): void {
    this.comboCount += 1 + flips;
  }

  reset(): void {
    this.comboCount = 0;
  }

  get multiplier(): number {
    return Math.min(1 + this.comboCount * COMBO_STEP, COMBO_MAX_MULTIPLIER);
  }
}
