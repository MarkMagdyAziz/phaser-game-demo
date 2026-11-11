import * as Phaser from 'phaser';
import { AnimalKind, ANIMAL_CONFIGS } from '../entities/animal';
import { scaleBody } from '../body-geometry';
import {
  ANIMAL_DENSITY,
  ANIMAL_KEEP_BEHIND_SLOTS,
  ANIMAL_LOOK_AHEAD_SLOTS,
  ANIMAL_SLOT_WIDTH,
  WOLF_SCALE,
} from '../game-tunbles';
import { TerrainGenerator } from './terrain-generator';

export class AnimalSystem {
  readonly group: Phaser.Physics.Arcade.StaticGroup;

  private readonly active = new Map<number, Phaser.Physics.Arcade.Sprite>();
  private readonly consumed = new Set<number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly terrain: TerrainGenerator,
    private readonly densityAt: (x: number) => number = () => ANIMAL_DENSITY,
  ) {
    this.group = scene.physics.add.staticGroup();
  }

  update(camLeft: number, camRight: number): void {
    const minSlot = Math.max(1, Math.floor(camLeft / ANIMAL_SLOT_WIDTH) - ANIMAL_KEEP_BEHIND_SLOTS);
    const maxSlot = Math.floor(camRight / ANIMAL_SLOT_WIDTH) + ANIMAL_LOOK_AHEAD_SLOTS;

    this.active.forEach((sprite, slot) => {
      if (slot < minSlot || slot > maxSlot) {
        this.deactivate(slot, sprite);
      }
    });

    for (let slot = minSlot; slot <= maxSlot; slot++) {
      if (this.active.has(slot) || this.consumed.has(slot)) {
        continue;
      }
      const kind = this.kindForSlot(slot);
      if (kind !== null) {
        this.activate(slot, kind);
      }
    }

    this.consumed.forEach((slot) => {
      if (slot < minSlot) {
        this.consumed.delete(slot);
      }
    });
  }

  consume(sprite: Phaser.Physics.Arcade.Sprite): void {
    const slot = sprite.getData('animalSlot') as number;
    this.consumed.add(slot);
    this.deactivate(slot, sprite);
  }

  private kindForSlot(slot: number): AnimalKind | null {
    const h = this.hash(slot);
    if ((h % 1000) / 1000 >= this.densityAt(slot * ANIMAL_SLOT_WIDTH)) {
      return null;
    }
    return AnimalKind.WOLF;
  }

  private activate(slot: number, kind: AnimalKind): void {
    const config = ANIMAL_CONFIGS[kind];
    const x = slot * ANIMAL_SLOT_WIDTH + (this.hash(slot) % 160);
    const y = this.terrain.surfaceYAt(x);
    const sprite = this.group.get(x, y, config.textureKey) as Phaser.Physics.Arcade.Sprite;

    sprite.setOrigin(0.5, 1).setPosition(x, y);
    sprite.enableBody(false, x, y, true, true);
    // The wolf is painted at boot, so it has no entry in TEXTURE_ASSETS; apply
    // its torso box by hand, mirroring applyAssetSpec's static-body ordering.
    const world = scaleBody(config.body, WOLF_SCALE);
    sprite.setScale(WOLF_SCALE);
    sprite.body?.setOffset(0, 0);
    sprite.refreshBody();
    sprite.body?.setSize(world.width, world.height, false);
    sprite.body?.setOffset(world.offsetX, world.offsetY);
    sprite.setData('animalSlot', slot);
    sprite.setData('animalKind', kind);

    this.active.set(slot, sprite);
  }

  private deactivate(slot: number, sprite: Phaser.Physics.Arcade.Sprite): void {
    this.active.delete(slot);
    sprite.disableBody(true, true);
  }

  private hash(slot: number): number {
    let h = (slot * 2246822519) >>> 0;
    h = ((h >>> 15) ^ h) * 0x2545f491;
    h = ((h >>> 13) ^ h) * 0x2545f491;
    h = (h >>> 16) ^ h;
    return h >>> 0;
  }
}
