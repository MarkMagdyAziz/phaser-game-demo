import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
  type AfterViewInit,
  type OnDestroy,
} from '@angular/core';
import { Game3Service } from './game-3.service';
import { GameEventBus } from './game-events';

@Component({
  selector: 'app-game-3',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './game-3.component.css',
  templateUrl: './game-3.component.html',
})
export class Game3Component implements AfterViewInit, OnDestroy {
  private readonly gameContainer = viewChild.required<ElementRef<HTMLDivElement>>('gameContainer');
  private readonly gameService = inject(Game3Service);
  private readonly zone = inject(NgZone);
  private readonly events = new GameEventBus();
  private readonly unsubscribers: Array<() => void> = [];

  protected readonly score = signal(0);
  protected readonly coins = signal(0);
  protected readonly combo = signal(1);
  protected readonly mount = signal<string | null>(null);
  protected readonly status = signal<'playing' | 'over'>('playing');
  protected readonly finalScore = signal(0);
  protected readonly cause = signal('');

  async ngAfterViewInit(): Promise<void> {
    this.bindGameEvents();

    const container = this.gameContainer().nativeElement;
    try {
      await this.gameService.create(container, this.events);
    } catch (error) {
      console.error('Failed to start the Phaser game', error);
      container.textContent = 'Failed to start the game.';
    }
  }

  ngOnDestroy(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.events.clear();
    this.gameService.destroy();
  }

  protected restart(): void {
    this.gameService.restart();
  }

  private bindGameEvents(): void {
    const run = (update: () => void): void => this.zone.run(update);

    this.unsubscribers.push(
      this.events.on('GAME_STARTED', () =>
        run(() => {
          this.status.set('playing');
          this.mount.set(null);
          this.cause.set('');
          this.finalScore.set(0);
        }),
      ),
      this.events.on('SCORE_CHANGED', ({ score, coins, combo }) =>
        run(() => {
          this.score.set(score);
          this.coins.set(coins);
          this.combo.set(combo);
        }),
      ),
      this.events.on('PLAYER_MOUNTED', ({ kind }) => run(() => this.mount.set(kind))),
      this.events.on('PLAYER_CRASHED', ({ cause }) => run(() => this.cause.set(cause))),
      this.events.on('GAME_OVER', ({ score, reason }) =>
        run(() => {
          this.status.set('over');
          this.finalScore.set(score);
          this.cause.set(reason);
        }),
      ),
      this.events.on('GAME_RESTARTED', () =>
        run(() => {
          this.status.set('playing');
          this.finalScore.set(0);
          this.cause.set('');
        }),
      ),
    );
  }
}
