import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../asset-keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start('PreloadScene');
  }

  private generatePlaceholderTextures(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRoundedRect(0, 0, 32, 32, 6);
    graphics.generateTexture(ASSET_KEYS.player, 32, 32);

    graphics.clear();
    graphics.fillStyle(0xf8fafc, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.generateTexture(ASSET_KEYS.snow, 64, 64);

    graphics.clear();
    graphics.fillStyle(0x7c4a1d, 1);
    graphics.fillRect(11, 22, 10, 24);
    graphics.fillStyle(0x166534, 1);
    graphics.fillTriangle(2, 22, 16, 0, 30, 22);
    graphics.fillTriangle(5, 34, 16, 14, 27, 34);
    graphics.generateTexture(ASSET_KEYS.tree, 33, 46);

    graphics.clear();
    graphics.fillStyle(0x94a3b8, 1);
    graphics.fillCircle(14, 13, 11);
    graphics.fillCircle(28, 17, 8);
    graphics.fillRect(0, 13, 44, 11);
    graphics.generateTexture(ASSET_KEYS.rock, 44, 24);

    graphics.clear();
    graphics.fillStyle(0xf1f5f9, 1);
    graphics.fillCircle(16, 12, 12);
    graphics.fillCircle(34, 14, 9);
    graphics.fillRect(0, 12, 48, 12);
    graphics.generateTexture(ASSET_KEYS.snowPile, 48, 24);

    graphics.clear();
    graphics.fillStyle(0xbae6fd, 1);
    graphics.fillTriangle(0, 27, 52, 5, 52, 27);
    graphics.lineStyle(2, 0x38bdf8, 1);
    graphics.strokeTriangle(0, 27, 52, 5, 52, 27);
    graphics.generateTexture(ASSET_KEYS.ramp, 52, 28);

    graphics.clear();
    graphics.fillStyle(0x64748b, 1);
    graphics.fillRect(6, 8, 26, 13);
    graphics.fillRect(9, 20, 4, 8);
    graphics.fillRect(24, 20, 4, 8);
    graphics.fillTriangle(32, 8, 44, 13, 32, 21);
    graphics.fillTriangle(6, 10, 0, 3, 6, 17);
    graphics.fillStyle(0x0f172a, 1);
    graphics.fillRect(38, 12, 2, 2);
    graphics.generateTexture(ASSET_KEYS.wolf, 44, 28);

    graphics.clear();
    graphics.fillStyle(0xfacc15, 1);
    graphics.fillCircle(9, 9, 9);
    graphics.fillStyle(0xb45309, 1);
    graphics.fillCircle(9, 9, 4);
    graphics.generateTexture(ASSET_KEYS.coin, 18, 18);

    graphics.clear();
    const skyTop = Phaser.Display.Color.ValueToColor(0x93c5fd);
    const skyBottom = Phaser.Display.Color.ValueToColor(0xe0f2fe);
    for (let i = 0; i < 12; i++) {
      const band = Phaser.Display.Color.Interpolate.ColorWithColor(skyTop, skyBottom, 11, i);
      graphics.fillStyle(Phaser.Display.Color.GetColor(band.r, band.g, band.b), 1);
      graphics.fillRect(0, i * 50, 8, 50);
    }
    graphics.generateTexture(ASSET_KEYS.bgSky, 8, 600);

    graphics.clear();
    for (let i = 0; i < 4; i++) {
      const peakX = i * 64 + 32;
      graphics.fillStyle(0xcbd5e1, 1);
      graphics.fillTriangle(peakX - 40, 160, peakX, 30, peakX + 40, 160);
      graphics.fillStyle(0xf8fafc, 1);
      graphics.fillTriangle(peakX - 14, 66, peakX, 30, peakX + 14, 66);
    }
    graphics.generateTexture(ASSET_KEYS.bgFar, 256, 160);

    graphics.clear();
    for (let i = 0; i < 4; i++) {
      const peakX = i * 64 + 32;
      graphics.fillStyle(0x94a3b8, 1);
      graphics.fillTriangle(peakX - 44, 140, peakX, 46, peakX + 44, 140);
      graphics.fillStyle(0xe2e8f0, 1);
      graphics.fillTriangle(peakX - 12, 74, peakX, 46, peakX + 12, 74);
    }
    graphics.generateTexture(ASSET_KEYS.bgMid, 256, 140);

    graphics.clear();
    graphics.fillStyle(0xffffff, 0.95);
    graphics.fillCircle(34, 34, 20);
    graphics.fillCircle(66, 28, 26);
    graphics.fillCircle(100, 34, 20);
    graphics.fillRect(20, 34, 100, 20);
    graphics.generateTexture(ASSET_KEYS.bgCloud, 140, 56);

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(40, 28, 22);
    graphics.fillCircle(120, 30, 26);
    graphics.fillCircle(200, 28, 22);
    graphics.fillRect(0, 28, 256, 12);
    graphics.generateTexture(ASSET_KEYS.bgSnow, 256, 40);

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.generateTexture(ASSET_KEYS.particle, 6, 6);

    graphics.destroy();
  }
}
