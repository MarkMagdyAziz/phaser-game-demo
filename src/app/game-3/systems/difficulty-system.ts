import {
  ANIMAL_DENSITY,
  DIFFICULTY_ANIMAL_BONUS,
  DIFFICULTY_OBSTACLE_BONUS,
  DIFFICULTY_RAMP_DISTANCE,
  DIFFICULTY_SPEED_BONUS,
  DIFFICULTY_TERRAIN_BONUS,
  OBSTACLE_DENSITY,
} from '../game-tunbles';

export class DifficultySystem {
  constructor(private readonly startX: number) {}

  progressAt(x: number): number {
    const t = (x - this.startX) / DIFFICULTY_RAMP_DISTANCE;
    return Math.min(Math.max(t, 0), 1);
  }

  obstacleDensityAt(x: number): number {
    return OBSTACLE_DENSITY + this.progressAt(x) * DIFFICULTY_OBSTACLE_BONUS;
  }

  animalDensityAt(x: number): number {
    return ANIMAL_DENSITY + this.progressAt(x) * DIFFICULTY_ANIMAL_BONUS;
  }

  speedScaleAt(x: number): number {
    return 1 + this.progressAt(x) * DIFFICULTY_SPEED_BONUS;
  }

  terrainComplexityAt(x: number): number {
    return 1 + this.progressAt(x) * DIFFICULTY_TERRAIN_BONUS;
  }
}
