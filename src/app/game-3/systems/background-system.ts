import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../asset-keys';
import {
  BG_PARALLAX_CLOUD,
  BG_PARALLAX_FAR,
  BG_PARALLAX_FOREGROUND,
  BG_PARALLAX_MID,
} from '../game-tunbles';

export class BackgroundSystem {
  private readonly clouds: Phaser.GameObjects.TileSprite;
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly mid: Phaser.GameObjects.TileSprite;
  private readonly foreground: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;

    scene.add
      .tileSprite(0, 0, width, height, ASSET_KEYS.bgSky)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-100);

    this.clouds = scene.add
      .tileSprite(0, 36, width, 56, ASSET_KEYS.bgCloud)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-95);

    this.far = scene.add
      .tileSprite(0, height * 0.4, width, 160, ASSET_KEYS.bgFar)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-90);

    this.mid = scene.add
      .tileSprite(0, height * 0.52, width, 140, ASSET_KEYS.bgMid)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-85);

    this.foreground = scene.add
      .tileSprite(0, height - 40, width, 40, ASSET_KEYS.bgSnow)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(8)
      .setAlpha(0.9);
  }

  update(scrollX: number, time: number): void {
    this.clouds.tilePositionX = scrollX * BG_PARALLAX_CLOUD + time * 0.01;
    this.far.tilePositionX = scrollX * BG_PARALLAX_FAR;
    this.mid.tilePositionX = scrollX * BG_PARALLAX_MID;
    this.foreground.tilePositionX = scrollX * BG_PARALLAX_FOREGROUND;
  }
}
