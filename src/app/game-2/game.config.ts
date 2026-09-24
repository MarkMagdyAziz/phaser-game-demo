import * as Phaser from 'phaser';
import { FirstScene } from './scenes/first-scene';

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
    title: 'GAME 2 - DEMO',
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
    scene: [FirstScene],
  };
}