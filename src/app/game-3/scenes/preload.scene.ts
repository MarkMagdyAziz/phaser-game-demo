import * as Phaser from 'phaser';
import { FONT_FAMILIES } from '../entities/asset-keys';
import { TEXTURE_ASSETS } from '../asset-specs';
import { AUDIO_FILES, AUDIO_KEYS } from '../entities/audio-keys';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-tunbles';

const BAR_WIDTH = 360;
const BAR_HEIGHT = 18;
const BAR_TRACK_COLOR = 0x1e293b;
const BAR_FILL_COLOR = 0x38bdf8;

/**
 * Loads the curated CC0 art, the Kenney fonts and the existing audio, showing a
 * progress bar meanwhile (decision D12).
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.createLoadingUi();

    TEXTURE_ASSETS.forEach((asset) => {
      this.load.image(asset.key, asset.path);
    });

    (Object.keys(AUDIO_FILES) as (keyof typeof AUDIO_FILES)[]).forEach((name) => {
      this.load.audio(AUDIO_KEYS[name], AUDIO_FILES[name]);
    });

    this.load.on(Phaser.Loader.Events.PROGRESS, this.onProgress, this);
    this.load.on(Phaser.Loader.Events.COMPLETE, this.onComplete, this);
  }

  private barFill!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  private createLoadingUi(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, BAR_WIDTH + 28, BAR_HEIGHT + 26, 0x0f172a, 0.82).setOrigin(0.5);

    this.add
      .text(cx, cy - 54, 'LOADING', {
        fontFamily: FONT_FAMILIES.future,
        fontSize: '24px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    this.barFill = this.add.graphics();

    this.label = this.add
      .text(cx, cy + 34, '0%', {
        fontFamily: FONT_FAMILIES.pixel,
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
  }

  private onProgress(value: number): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.barFill.clear();
    this.barFill.fillStyle(BAR_TRACK_COLOR, 1);
    this.barFill.fillRoundedRect(cx - BAR_WIDTH / 2, cy - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, 6);
    this.barFill.fillStyle(BAR_FILL_COLOR, 1);
    this.barFill.fillRoundedRect(
      cx - BAR_WIDTH / 2 + 3,
      cy - BAR_HEIGHT / 2 + 3,
      Math.max(0, (BAR_WIDTH - 6) * value),
      BAR_HEIGHT - 6,
      4,
    );

    this.label.setText(`${Math.round(value * 100)}%`);
  }

  private onComplete(): void {
    this.load.off(Phaser.Loader.Events.PROGRESS, this.onProgress, this);
    this.load.off(Phaser.Loader.Events.COMPLETE, this.onComplete, this);

    // Phaser measures Text with the canvas font stack, so the Kenney faces have
    // to be resident before the first frame renders or every label falls back
    // to monospace for its first paint.
    this.ensureFontsLoaded().finally(() => this.scene.start('GameScene'));
  }

  private async ensureFontsLoaded(): Promise<void> {
    if (typeof document === 'undefined' || !document.fonts) {
      return;
    }
    const families = Object.values(FONT_FAMILIES);
    try {
      await Promise.all(families.map((family) => document.fonts.load(`16px "${family}"`)));
    } catch {
      // A missing font is cosmetic; the scene still starts.
    }
  }
}
