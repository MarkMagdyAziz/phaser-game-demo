import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'game',
    loadComponent: () => import('./game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'game-2',
    loadComponent: () => import('./game-2/game-2.component').then((m) => m.Game2Component),
  },
  {
    path: '**',
    redirectTo: '',
  },
];