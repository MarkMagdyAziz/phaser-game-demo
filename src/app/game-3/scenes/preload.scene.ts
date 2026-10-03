import * as Phaser from 'phaser';
import { AUDIO_FILES, AUDIO_KEYS } from '../audio-keys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    (Object.keys(AUDIO_FILES) as (keyof typeof AUDIO_FILES)[]).forEach((name) => {
      this.load.audio(AUDIO_KEYS[name], AUDIO_FILES[name]);
    });

    this.load.on('complete', () => {
      this.scene.start('GameScene');
    });
  }
}
