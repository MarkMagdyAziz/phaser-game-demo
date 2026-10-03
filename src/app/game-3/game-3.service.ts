import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createGameConfig } from './game.config';
import { GAME_EVENTS_KEY, GameEventBus } from './game-events';
import type * as Phaser from 'phaser';

@Injectable({ providedIn: 'root' })
export class Game3Service {
  private readonly platformId = inject(PLATFORM_ID);
  private game: Phaser.Game | null = null;

  async create(container: HTMLElement, events?: GameEventBus): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.game) {
      return;
    }

    const PhaserModule = await import('phaser');
    this.game = new PhaserModule.Game(createGameConfig(container));
    if (events) {
      this.game.registry.set(GAME_EVENTS_KEY, events);
    }
  }

  restart(): void {
    this.game?.scene.getScene('GameScene')?.scene.restart();
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}
