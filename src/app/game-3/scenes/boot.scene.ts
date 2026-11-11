import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../entities/asset-keys';
import { WOLF_TEXTURE_HEIGHT, WOLF_TEXTURE_WIDTH } from '../game-tunbles';

/**
 * Boot runs before any file is loaded, so it can only paint textures with the
 * graphics API.
 *
 * Decision D6 replaced every placeholder with real CC0 art; the only thing
 * still drawn at runtime is the wolf, because no Kenney pack ships one
 * (decision D10). That art is original to this project - see ASSETS.md.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.drawWolfTexture();
    this.scene.start('PreloadScene');
  }

  /**
   * Paints a side-on wolf facing right. Built from layered shapes with a dark
   * outline so it reads clearly against both the white snow fill and the green
   * near treeline.
   */
  private drawWolfTexture(): void {
    const w = WOLF_TEXTURE_WIDTH;
    const h = WOLF_TEXTURE_HEIGHT;
    const graphics = this.add.graphics();

    const outline = 0x2f2a26;
    const fur = 0x8d99ae;
    const furLight = 0xb8c0d0;
    const belly = 0xdfe4ec;

    // Ground shadow, so the wolf sits on the snow instead of floating.
    graphics.fillStyle(0x2f2a26, 0.18);
    graphics.fillEllipse(w * 0.46, h - 3, w * 0.62, 9);

    // Tail: bushy wedge sweeping back and up from the haunch.
    graphics.fillStyle(outline, 1);
    graphics.fillTriangle(w * 0.16, h * 0.62, w * 0.0, h * 0.22, w * 0.2, h * 0.46);
    graphics.fillStyle(fur, 1);
    graphics.fillTriangle(w * 0.17, h * 0.61, w * 0.045, h * 0.28, w * 0.185, h * 0.47);

    // Far hind leg.
    graphics.fillStyle(outline, 1);
    graphics.fillRoundedRect(w * 0.3, h * 0.62, 11, h * 0.33, 5);
    graphics.fillStyle(fur, 1);
    graphics.fillRoundedRect(w * 0.3 + 2, h * 0.62 + 2, 7, h * 0.31 - 2, 4);

    // Body: elongated ellipse with a slightly higher haunch.
    graphics.fillStyle(outline, 1);
    graphics.fillEllipse(w * 0.5, h * 0.56, w * 0.58, h * 0.46);
    graphics.fillEllipse(w * 0.33, h * 0.5, w * 0.28, h * 0.34);
    graphics.fillStyle(fur, 1);
    graphics.fillEllipse(w * 0.5, h * 0.565, w * 0.54, h * 0.41);
    graphics.fillEllipse(w * 0.33, h * 0.505, w * 0.245, h * 0.3);

    // Belly highlight.
    graphics.fillStyle(belly, 1);
    graphics.fillEllipse(w * 0.52, h * 0.72, w * 0.4, h * 0.14);

    // Near hind leg.
    graphics.fillStyle(outline, 1);
    graphics.fillRoundedRect(w * 0.26, h * 0.66, 12, h * 0.3, 5);
    graphics.fillStyle(furLight, 1);
    graphics.fillRoundedRect(w * 0.26 + 2, h * 0.66 + 2, 8, h * 0.28 - 2, 4);

    // Front legs.
    graphics.fillStyle(outline, 1);
    graphics.fillRoundedRect(w * 0.66, h * 0.64, 10, h * 0.31, 4);
    graphics.fillRoundedRect(w * 0.74, h * 0.64, 10, h * 0.31, 4);
    graphics.fillStyle(furLight, 1);
    graphics.fillRoundedRect(w * 0.66 + 2, h * 0.64 + 2, 6, h * 0.29 - 2, 3);
    graphics.fillRoundedRect(w * 0.74 + 2, h * 0.64 + 2, 6, h * 0.29 - 2, 3);

    // Neck + head, raised and facing right.
    graphics.fillStyle(outline, 1);
    graphics.fillEllipse(w * 0.79, h * 0.36, w * 0.3, h * 0.3);
    graphics.fillRoundedRect(w * 0.68, h * 0.4, w * 0.16, h * 0.26, 8);
    graphics.fillStyle(fur, 1);
    graphics.fillEllipse(w * 0.79, h * 0.365, w * 0.265, h * 0.265);
    graphics.fillRoundedRect(w * 0.685, h * 0.41, w * 0.14, h * 0.23, 7);

    // Ears.
    graphics.fillStyle(outline, 1);
    graphics.fillTriangle(w * 0.72, h * 0.24, w * 0.76, h * 0.06, w * 0.81, h * 0.25);
    graphics.fillTriangle(w * 0.82, h * 0.24, w * 0.87, h * 0.09, w * 0.9, h * 0.26);
    graphics.fillStyle(furLight, 1);
    graphics.fillTriangle(w * 0.735, h * 0.235, w * 0.762, h * 0.105, w * 0.795, h * 0.243);
    graphics.fillTriangle(w * 0.833, h * 0.235, w * 0.868, h * 0.13, w * 0.888, h * 0.25);

    // Snout.
    graphics.fillStyle(outline, 1);
    graphics.fillRoundedRect(w * 0.86, h * 0.36, w * 0.15, h * 0.16, 7);
    graphics.fillStyle(furLight, 1);
    graphics.fillRoundedRect(w * 0.865, h * 0.365, w * 0.135, h * 0.145, 6);

    // Eye + nose.
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(w * 0.835, h * 0.33, 4.5);
    graphics.fillStyle(0x1f2937, 1);
    graphics.fillCircle(w * 0.842, h * 0.33, 2.4);
    graphics.fillStyle(0x111827, 1);
    graphics.fillCircle(w * 0.995, h * 0.43, 3.4);

    // Fur ruff along the back of the neck.
    graphics.fillStyle(furLight, 1);
    graphics.fillEllipse(w * 0.7, h * 0.47, w * 0.13, h * 0.2);

    graphics.generateTexture(ASSET_KEYS.wolf, w, h);
    graphics.destroy();
  }
}
