import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../entities/asset-keys';
import {
  CHUNK_WIDTH,
  SURFACE_COLOR,
  SURFACE_LINE_COLOR,
  SURFACE_SAMPLE_STEP,
  TERRAIN_CRUST_DEPTH,
  TERRAIN_CRUST_STEP,
  TERRAIN_FILL_DEPTH,
} from '../game-tunbles';

export interface TerrainConfig {
  worldHeight: number;
  surfaceMidY: number;
  surfaceAmpLarge: number;
  surfacePeriodLarge: number;
  surfaceAmpSmall: number;
  surfacePeriodSmall: number;
  complexityAt?: (x: number) => number;
}

/**
 * A streamed terrain segment. The Graphics polygon is the solid snow mass and
 * guarantees there is never a gap under the curve; the crust images are stamped
 * along the contour to give the surface real Kenney snow texture (decision
 * D13). Both are pooled and reused as the camera moves.
 */
export interface TerrainChunk {
  readonly fill: Phaser.GameObjects.Graphics;
  readonly crust: readonly Phaser.GameObjects.Image[];
}

/** Tiles needed to cover one chunk: middle tiles plus a cap at each end. */
const CRUST_TILES_PER_CHUNK = Math.ceil(CHUNK_WIDTH / TERRAIN_CRUST_STEP) + 2;

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

  drawChunk(scene: Phaser.Scene, startX: number, endX: number): TerrainChunk {
    const fill = scene.add.graphics().setDepth(TERRAIN_FILL_DEPTH);

    const crust: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < CRUST_TILES_PER_CHUNK; i++) {
      // Origin (0.5, 0) pins the tile's TOP edge to the surface, which is what
      // turns the bumpy cloud silhouette into the snow line.
      crust.push(
        scene.add
          .image(0, 0, ASSET_KEYS.terrainCrust)
          .setOrigin(0.5, 0)
          .setDepth(TERRAIN_CRUST_DEPTH),
      );
    }

    const chunk: TerrainChunk = { fill, crust };
    this.redrawChunk(chunk, startX, endX);
    return chunk;
  }

  redrawChunk(chunk: TerrainChunk, startX: number, endX: number): void {
    this.redrawFill(chunk.fill, startX, endX);
    this.redrawCrust(chunk.crust, startX, endX);
  }

  /** Solid snow body: a closed polygon from the contour down to the world floor. */
  private redrawFill(graphics: Phaser.GameObjects.Graphics, startX: number, endX: number): void {
    graphics.clear();
    graphics.fillStyle(SURFACE_COLOR, 1);
    graphics.beginPath();
    this.traceSurface(graphics, startX, endX);
    graphics.lineTo(endX, this.config.worldHeight);
    graphics.lineTo(startX, this.config.worldHeight);
    graphics.closePath();
    graphics.fillPath();

    // Crisp, near-white edge so the surface reads as ice and any seam between
    // crust tiles is hidden by a continuous line.
    graphics.lineStyle(2, SURFACE_LINE_COLOR, 0.9);
    graphics.beginPath();
    this.traceSurface(graphics, startX, endX);
    graphics.strokePath();
  }

  /**
   * Stamps crust tiles along the contour. Tiles are 64px wide but placed every
   * TERRAIN_CRUST_STEP px, so consecutive tiles overlap roughly 3x and the
   * chain reads as one continuous lumpy snow surface. The tile's top edge is
   * pinned to the surface, so the bumpy silhouette of terrain_snow_cloud_*
   * becomes the snow line.
   *
   * Index 0 uses the left cap and the last index the right cap so chunk joins do
   * not show a hard vertical cut; any surplus tiles are parked off-screen.
   */
  private redrawCrust(
    crust: readonly Phaser.GameObjects.Image[],
    startX: number,
    endX: number,
  ): void {
    if (crust.length === 0) {
      return;
    }

    const minX = startX + 32;
    const maxX = endX - 32;
    const usable = crust.length - 2;
    const step = usable > 1 ? (maxX - minX) / (usable - 1) : 0;

    crust[0]
      .setTexture(ASSET_KEYS.terrainCrustLeft)
      .setPosition(minX, this.surfaceYAt(minX))
      .setRotation(this.slopeAngleAt(minX));
    crust[0].setVisible(true).setActive(true);

    for (let i = 1; i <= usable; i++) {
      const x = minX + step * i;
      const tile = crust[i];
      // The tiles have a flat top edge, so tilting each one to the local slope
      // turns a 20px staircase into one continuous surface line.
      tile
        .setTexture(ASSET_KEYS.terrainCrust)
        .setPosition(x, this.surfaceYAt(x))
        .setRotation(this.slopeAngleAt(x));
      tile.setVisible(true).setActive(true);
    }

    const last = crust[crust.length - 1];
    last
      .setTexture(ASSET_KEYS.terrainCrustRight)
      .setPosition(maxX, this.surfaceYAt(maxX))
      .setRotation(this.slopeAngleAt(maxX));
    last.setVisible(true).setActive(true);
  }

  private traceSurface(graphics: Phaser.GameObjects.Graphics, startX: number, endX: number): void {
    graphics.moveTo(startX, this.surfaceYAt(startX));
    for (let x = startX + SURFACE_SAMPLE_STEP; x <= endX; x += SURFACE_SAMPLE_STEP) {
      graphics.lineTo(x, this.surfaceYAt(x));
    }
  }

  /** Hides every crust tile, so a pooled chunk is never drawn at a stale position. */
  hideCrust(chunk: TerrainChunk): void {
    chunk.crust.forEach((tile) => tile.setVisible(false).setActive(false));
  }
}
