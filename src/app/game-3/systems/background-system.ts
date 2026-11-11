import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../entities/asset-keys';
import {
  BG_CLOUD_ALPHA,
  BG_CLOUD_Y,
  BG_FAR_Y,
  BG_MID_Y,
  BG_PARALLAX_CLOUD,
  BG_PARALLAX_FAR,
  BG_PARALLAX_FOREGROUND,
  BG_PARALLAX_MID,
  BG_SNOW_ALPHA,
} from '../game-tunbles';

/**
 * Parallax stack built from cropped, opaque Kenney background bands (see
 * art-source/tools/curate-game3-assets.ps1). Each band is a tileSprite that
 * scrolls at its own rate; because every band is opaque and only its scenery,
 * the sky texture above them is never hidden and the joins stay seamless
 * horizontally because the sources tile.
 *
 * Bands sit high on screen (see BG_*_Y) because the snow surface occupies most
 * of the view; the terrain then occludes them as the slope rises.
 */
export class BackgroundSystem {
  private readonly clouds: Phaser.GameObjects.TileSprite;
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly mid: Phaser.GameObjects.TileSprite;
  private readonly foreground: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    const { width } = scene.scale;

    scene.add
      .tileSprite(0, 0, width, scene.scale.height, ASSET_KEYS.bgSky)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-100);

    this.clouds = scene.add
      .tileSprite(0, BG_CLOUD_Y, width, 146, ASSET_KEYS.bgClouds)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-95)
      .setAlpha(BG_CLOUD_ALPHA);

    // Faded distant treeline, including its white snow ground band.
    this.far = scene.add
      .tileSprite(0, BG_FAR_Y, width, 176, ASSET_KEYS.bgTreesFar)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-90);

    // Near evergreen treeline. Cropped above the ground band so it layers on
    // top of the far snow instead of replacing it with green.
    this.mid = scene.add
      .tileSprite(0, BG_MID_Y, width, 96, ASSET_KEYS.bgTreesNear)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-85);

    this.foreground = scene.add
      .tileSprite(0, scene.scale.height - 40, width, 40, ASSET_KEYS.terrainStrip)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(8)
      .setAlpha(BG_SNOW_ALPHA);
  }

  update(scrollX: number, time: number): void {
    this.clouds.tilePositionX = scrollX * BG_PARALLAX_CLOUD + time * 0.01;
    this.far.tilePositionX = scrollX * BG_PARALLAX_FAR;
    this.mid.tilePositionX = scrollX * BG_PARALLAX_MID;
    this.foreground.tilePositionX = scrollX * BG_PARALLAX_FOREGROUND;
  }
}
