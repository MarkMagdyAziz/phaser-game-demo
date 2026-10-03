import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../asset-keys';
import {
  COIN_DENSITY,
  COIN_KEEP_BEHIND_SLOTS,
  COIN_LOOK_AHEAD_SLOTS,
  COIN_SLOT_WIDTH,
  COIN_SURFACE_OFFSET,
} from '../game-tunbles';
import { TerrainGenerator } from './terrain-generator';

export class CoinSystem {
  readonly group: Phaser.Physics.Arcade.StaticGroup;

  private readonly active = new Map<number, Phaser.Physics.Arcade.Sprite>();
  private readonly collected = new Set<number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly terrain: TerrainGenerator,
  ) {
    this.group = scene.physics.add.staticGroup();
  }

  update(camLeft: number, camRight: number): void {
    const minSlot = Math.max(1, Math.floor(camLeft / COIN_SLOT_WIDTH) - COIN_KEEP_BEHIND_SLOTS);
    const maxSlot = Math.floor(camRight / COIN_SLOT_WIDTH) + COIN_LOOK_AHEAD_SLOTS;

    this.active.forEach((sprite, slot) => {
      if (slot < minSlot || slot > maxSlot) {
        this.deactivate(slot, sprite);
      }
    });

    for (let slot = minSlot; slot <= maxSlot; slot++) {
      if (this.active.has(slot) || this.collected.has(slot)) {
        continue;
      }
      if (this.hasCoinAt(slot)) {
        this.activate(slot);
      }
    }

    this.collected.forEach((slot) => {
      if (slot < minSlot) {
        this.collected.delete(slot);
      }
    });
  }

  collect(sprite: Phaser.Physics.Arcade.Sprite): void {
    const slot = sprite.getData('coinSlot') as number;
    this.collected.add(slot);
    this.deactivate(slot, sprite);
  }

  private hasCoinAt(slot: number): boolean {
    const h = this.hash(slot);
    return (h % 1000) / 1000 < COIN_DENSITY;
  }

  private activate(slot: number): void {
    const x = slot * COIN_SLOT_WIDTH + (this.hash(slot) % 120);
    const y = this.terrain.surfaceYAt(x) - COIN_SURFACE_OFFSET;
    const sprite = this.group.get(x, y, ASSET_KEYS.coin) as Phaser.Physics.Arcade.Sprite;

    sprite.setPosition(x, y);
    sprite.enableBody(false, x, y, true, true);
    sprite.refreshBody();
    sprite.setData('coinSlot', slot);

    this.active.set(slot, sprite);
  }

  private deactivate(slot: number, sprite: Phaser.Physics.Arcade.Sprite): void {
    this.active.delete(slot);
    sprite.disableBody(true, true);
  }

  private hash(slot: number): number {
    let h = (slot * 374761393) >>> 0;
    h = ((h >>> 13) ^ h) * 0x5bd1e995;
    h = ((h >>> 15) ^ h) * 0x27d4eb2d;
    h = (h >>> 16) ^ h;
    return h >>> 0;
  }
}
