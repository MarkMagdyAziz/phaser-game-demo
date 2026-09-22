import * as Phaser from 'phaser';
import { BootScene } from './scenes/boot.scene';
import { MainScene } from './scenes/main.scene';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    title: 'GAME DEMO',
    backgroundColor: '#0f172a',
    fps: { target: 60, smoothStep: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: { antialias: false, pixelArt: true, roundPixels: true },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 300 }, debug: false },
    },
    scene: [BootScene, MainScene],
  };
}