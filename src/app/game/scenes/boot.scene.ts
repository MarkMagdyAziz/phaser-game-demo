import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRoundedRect(0, 0, 32, 32, 6);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();

    this.scene.start('MainScene');
  }
}