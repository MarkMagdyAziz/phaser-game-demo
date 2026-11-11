import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './game-tunbles';
import { BootScene } from './scenes/boot.scene';
import { PreloadScene } from './scenes/preload.scene';
import { GameScene } from './scenes/game.scene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    title: 'GAME 3 - SKI DEMO',
    backgroundColor: '#0f172a',
    fps: { target: 60, smoothStep: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    // Decision D11: the curated art is Kenney's vector-style work, not pixel art,
    // so bilinear sampling and texture filtering stay on.
    render: { antialias: true, pixelArt: false, roundPixels: false },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 300 }, debug: false },
    },
    scene: [BootScene, PreloadScene, GameScene],
  };
}
