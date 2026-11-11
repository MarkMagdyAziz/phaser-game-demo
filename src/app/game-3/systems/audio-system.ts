import * as Phaser from 'phaser';
import { AUDIO_KEYS } from '../entities/audio-keys';
import { AUDIO_VOLUME_AMBIENT, AUDIO_VOLUME_SFX, AUDIO_VOLUME_SKI } from '../game-tunbles';

export class AudioSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  startAmbient(): void {
    if (this.scene.sound.locked) {
      return;
    }
    if (this.has(AUDIO_KEYS.ambient)) {
      return;
    }
    this.scene.sound.play(AUDIO_KEYS.ambient, {
      loop: true,
      volume: AUDIO_VOLUME_AMBIENT,
    });
  }

  setSkiing(active: boolean): void {
    if (active) {
      if (!this.scene.sound.isPlaying(AUDIO_KEYS.skiLoop)) {
        this.scene.sound.play(AUDIO_KEYS.skiLoop, {
          loop: true,
          volume: AUDIO_VOLUME_SKI,
        });
      }
    } else if (this.scene.sound.isPlaying(AUDIO_KEYS.skiLoop)) {
      this.scene.sound.stopByKey(AUDIO_KEYS.skiLoop);
    }
  }

  playJump(): void {
    this.playOnce(AUDIO_KEYS.jump);
  }

  playLanding(): void {
    this.playOnce(AUDIO_KEYS.landing);
  }

  playCrash(): void {
    this.playOnce(AUDIO_KEYS.crash);
  }

  playCoin(): void {
    this.playOnce(AUDIO_KEYS.coin);
  }

  playCombo(): void {
    this.playOnce(AUDIO_KEYS.combo);
  }

  playUiClick(): void {
    this.playOnce(AUDIO_KEYS.uiClick);
  }

  private playOnce(key: string): void {
    if (this.scene.sound.locked) {
      return;
    }
    this.scene.sound.play(key, { volume: AUDIO_VOLUME_SFX });
  }

  private has(key: string): boolean {
    return this.scene.sound.getAll(key).length > 0;
  }
}
