import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Game2Service } from './game-2.service';

@Component({
  imports: [],
  selector: 'app-game-2',
  styleUrl: './game-2.css',
  templateUrl: './game-2.html',
})
export class Game2Component {
  private readonly gameContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('gameContainer');
  private readonly gameService = inject(Game2Service);

  async ngAfterViewInit(): Promise<void> {
    const container = this.gameContainer().nativeElement;
    try {
      await this.gameService.create(container);
    } catch (error) {
      console.error('Failed to start the Phaser game', error);
      container.textContent = 'Failed to start the game.';
    }
  }

  ngOnDestroy(): void {
    this.gameService.destroy();
  }
}
