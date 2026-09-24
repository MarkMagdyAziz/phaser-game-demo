import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './home.component.css',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly title = signal('-fe-change0title');

  protected readonly pills = [

    { title: 'Demo Game', link: '/game' },
    { title: 'Demo Game 2', link: '/game-2' },
  ];
}
