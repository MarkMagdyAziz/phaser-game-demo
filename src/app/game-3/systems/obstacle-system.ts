import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../entities/asset-keys';
import { applyAssetSpec } from '../asset-specs';
import {
  OBSTACLE_DENSITY,
  OBSTACLE_KEEP_BEHIND_SLOTS,
  OBSTACLE_LOOK_AHEAD_SLOTS,
  OBSTACLE_SCALE,
  OBSTACLE_SLOT_WIDTH,
} from '../game-tunbles';
import { TerrainGenerator } from './terrain-generator';

export enum ObstacleKind {
  TREE = 'TREE',
  ROCK = 'ROCK',
  SNOW_PILE = 'SNOW_PILE',
  RAMP = 'RAMP',
}

/**
 * Candidate textures per kind. Several variants per kind are picked by slot
 * hash so long stretches do not repeat, and each variant carries its own body
 * in asset-specs.ts (the two trees differ from the rocks by an order of
 * magnitude), so the body always matches the art actually used.
 */
const OBSTACLE_TEXTURES: Record<ObstacleKind, readonly string[]> = {
  [ObstacleKind.TREE]: [ASSET_KEYS.treeSnow, ASSET_KEYS.treeBare],
  [ObstacleKind.ROCK]: [ASSET_KEYS.rock],
  [ObstacleKind.SNOW_PILE]: [ASSET_KEYS.snowDrift, ASSET_KEYS.snowBush],
  [ObstacleKind.RAMP]: [ASSET_KEYS.ramp],
};

export class ObstacleSystem {
  readonly solidGroups: Phaser.Physics.Arcade.StaticGroup[];
  readonly rampGroup: Phaser.Physics.Arcade.StaticGroup;

  private readonly groups: Record<ObstacleKind, Phaser.Physics.Arcade.StaticGroup>;
  private readonly active = new Map<number, Phaser.Physics.Arcade.Sprite>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly terrain: TerrainGenerator,
    private readonly densityAt: (x: number) => number = () => OBSTACLE_DENSITY,
  ) {
    this.groups = {
      [ObstacleKind.TREE]: scene.physics.add.staticGroup(),
      [ObstacleKind.ROCK]: scene.physics.add.staticGroup(),
      [ObstacleKind.SNOW_PILE]: scene.physics.add.staticGroup(),
      [ObstacleKind.RAMP]: scene.physics.add.staticGroup(),
    };
    this.solidGroups = [
      this.groups[ObstacleKind.TREE],
      this.groups[ObstacleKind.ROCK],
      this.groups[ObstacleKind.SNOW_PILE],
    ];
    this.rampGroup = this.groups[ObstacleKind.RAMP];
  }

  update(camLeft: number, camRight: number): void {
    const minSlot = Math.max(
      1,
      Math.floor(camLeft / OBSTACLE_SLOT_WIDTH) - OBSTACLE_KEEP_BEHIND_SLOTS,
    );
    const maxSlot = Math.floor(camRight / OBSTACLE_SLOT_WIDTH) + OBSTACLE_LOOK_AHEAD_SLOTS;

    this.active.forEach((sprite, slot) => {
      if (slot < minSlot || slot > maxSlot) {
        this.deactivateSlot(slot, sprite);
      }
    });

    for (let slot = minSlot; slot <= maxSlot; slot++) {
      if (this.active.has(slot)) {
        continue;
      }
      const kind = this.kindForSlot(slot);
      if (kind === null) {
        continue;
      }
      this.activateSlot(slot, kind);
    }
  }

  private kindForSlot(slot: number): ObstacleKind | null {
    const h = this.hash(slot);
    if (slot === 0 || (h % 1000) / 1000 >= this.densityAt(slot * OBSTACLE_SLOT_WIDTH)) {
      return null;
    }
    const kindRoll = ((h >>> 11) % 1000) / 1000;
    if (kindRoll < 0.45) {
      return ObstacleKind.TREE;
    }
    if (kindRoll < 0.75) {
      return ObstacleKind.ROCK;
    }
    if (kindRoll < 0.9) {
      return ObstacleKind.SNOW_PILE;
    }
    return ObstacleKind.RAMP;
  }

  private activateSlot(slot: number, kind: ObstacleKind): void {
    const x = slot * OBSTACLE_SLOT_WIDTH + (this.hash(slot) % 100);
    const y = this.terrain.surfaceYAt(x);
    const texture = this.textureForSlot(slot, kind);
    const sprite = this.groups[kind].get(x, y, texture) as Phaser.Physics.Arcade.Sprite;

    // Obstacles stand on the snow line, so anchor to the bottom edge.
    sprite.setOrigin(0.5, 1).setPosition(x, y);
    sprite.enableBody(false, x, y, true, true);
    applyAssetSpec(sprite, texture, OBSTACLE_SCALE);

    // Ramps are launched by an overlap, not a collision, and the ramp group is
    // not in solidGroups, so no checkCollision flag is needed. Setting
    // checkCollision.none would stop Phaser's overlap from ever firing
    // (World.separate() bails out on it).
    const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
    if (kind === ObstacleKind.RAMP) {
      body.checkCollision.none = true;
    }
    this.active.set(slot, sprite);
  }

  private textureForSlot(slot: number, kind: ObstacleKind): string {
    const candidates = OBSTACLE_TEXTURES[kind];
    return candidates[this.hash(slot >>> 3) % candidates.length];
  }

  private deactivateSlot(slot: number, sprite: Phaser.Physics.Arcade.Sprite): void {
    this.active.delete(slot);
    sprite.disableBody(true, true);
  }

  private hash(slot: number): number {
    let h = (slot * 2654435761) >>> 0;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = (h >>> 16) ^ h;
    return h >>> 0;
  }
}
