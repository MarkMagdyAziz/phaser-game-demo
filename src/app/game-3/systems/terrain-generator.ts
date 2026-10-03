import * as Phaser from 'phaser';
import { SURFACE_COLOR, SURFACE_LINE_COLOR, SURFACE_SAMPLE_STEP } from '../game-tunbles';

export interface TerrainConfig {
  worldHeight: number;
  surfaceMidY: number;
  surfaceAmpLarge: number;
  surfacePeriodLarge: number;
  surfaceAmpSmall: number;
  surfacePeriodSmall: number;
  complexityAt?: (x: number) => number;
}

export class TerrainGenerator {
  constructor(private readonly config: TerrainConfig) {}

  surfaceYAt(x: number): number {
    const {
      surfaceMidY,
      surfaceAmpLarge,
      surfacePeriodLarge,
      surfaceAmpSmall,
      surfacePeriodSmall,
    } = this.config;
    const complexity = this.config.complexityAt ? this.config.complexityAt(x) : 1;
    return (
      surfaceMidY +
      Math.sin((x / surfacePeriodLarge) * Math.PI * 2) * surfaceAmpLarge * complexity +
      Math.sin((x / surfacePeriodSmall) * Math.PI * 2) * surfaceAmpSmall * complexity
    );
  }

  slopeAngleAt(x: number): number {
    return Math.atan2(this.surfaceYAt(x + 4) - this.surfaceYAt(x - 4), 8);
  }

  drawChunk(scene: Phaser.Scene, startX: number, endX: number): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    this.redrawChunk(graphics, startX, endX);
    return graphics;
  }

  redrawChunk(graphics: Phaser.GameObjects.Graphics, startX: number, endX: number): void {
    graphics.clear();

    graphics.fillStyle(SURFACE_COLOR, 1);
    graphics.beginPath();
    this.traceSurface(graphics, startX, endX);
    graphics.lineTo(endX, this.config.worldHeight);
    graphics.lineTo(startX, this.config.worldHeight);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(2, SURFACE_LINE_COLOR, 1);
    graphics.beginPath();
    this.traceSurface(graphics, startX, endX);
    graphics.strokePath();
  }

  private traceSurface(graphics: Phaser.GameObjects.Graphics, startX: number, endX: number): void {
    graphics.moveTo(startX, this.surfaceYAt(startX));
    for (let x = startX + SURFACE_SAMPLE_STEP; x <= endX; x += SURFACE_SAMPLE_STEP) {
      graphics.lineTo(x, this.surfaceYAt(x));
    }
  }
}
