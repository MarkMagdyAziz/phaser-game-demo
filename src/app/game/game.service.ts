import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createGameConfig } from './game.config';
import type * as Phaser from 'phaser';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly platformId = inject(PLATFORM_ID);
  private game: Phaser.Game | null = null;


  async create(container: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.game) {
      return;
    }

    const PhaserModule = await import('phaser');
    this.game = new PhaserModule.Game(createGameConfig(container));
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}