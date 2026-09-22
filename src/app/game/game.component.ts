import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
  type AfterViewInit,
  type OnDestroy,
} from '@angular/core';
import { GameService } from './game.service';

@Component({
  selector: 'app-game',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './game.component.css',
  templateUrl: './game.component.html',
})
export class GameComponent implements AfterViewInit, OnDestroy {
  private readonly gameContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('gameContainer');
  private readonly gameService = inject(GameService);

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