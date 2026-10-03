import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../asset-keys';
import {
  EFFECT_COIN_PARTICLES,
  EFFECT_CRASH_PARTICLES,
  EFFECT_JUMP_PARTICLES,
  EFFECT_LANDING_PARTICLES,
  EFFECT_SNOWFALL_FREQUENCY,
  EFFECT_TRAIL_FREQUENCY,
} from '../game-tunbles';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

export class EffectsSystem {
  private readonly snow: Emitter;
  private readonly trail: Emitter;
  private readonly landingBurst: Emitter;
  private readonly jumpBurst: Emitter;
  private readonly crashBurst: Emitter;
  private readonly coinBurst: Emitter;

  constructor(scene: Phaser.Scene) {
    const { width } = scene.scale;

    this.snow = scene.add.particles(0, 0, ASSET_KEYS.particle, {
      x: { min: 0, max: width },
      y: -8,
      lifespan: { min: 4000, max: 7000 },
      speedY: { min: 30, max: 80 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.5, end: 0.15 },
      alpha: { start: 0.9, end: 0.2 },
      frequency: EFFECT_SNOWFALL_FREQUENCY,
      quantity: 1,
      tint: 0xffffff,
      maxAliveParticles: 140,
    });
    this.snow.setScrollFactor(0).setDepth(8);

    this.trail = scene.add.particles(0, 0, ASSET_KEYS.particle, {
      x: 0,
      y: 0,
      lifespan: 350,
      speedX: { min: -20, max: 20 },
      speedY: { min: -30, max: -5 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: EFFECT_TRAIL_FREQUENCY,
      quantity: 1,
      tint: 0xe2e8f0,
      emitting: false,
    });
    this.trail.setDepth(4);

    this.landingBurst = this.createBurst(scene, 0xffffff, { min: 40, max: 130 }, 500, 260);
    this.jumpBurst = this.createBurst(scene, 0xffffff, { min: 30, max: 90 }, 400, 180);
    this.crashBurst = this.createBurst(scene, 0xef4444, { min: 60, max: 220 }, 600, 340);
    this.coinBurst = this.createBurst(scene, 0xfacc15, { min: 50, max: 160 }, 450, 0);
  }

  follow(target: Phaser.Types.Math.Vector2Like): void {
    this.trail.startFollow(target, 0, 14);
  }

  update(grounded: boolean, velocityX: number): void {
    this.trail.emitting = grounded && Math.abs(velocityX) > 30;
  }

  stopTrail(): void {
    this.trail.emitting = false;
  }

  burstLanding(x: number, y: number): void {
    this.landingBurst.explode(EFFECT_LANDING_PARTICLES, x, y);
  }

  burstJump(x: number, y: number): void {
    this.jumpBurst.explode(EFFECT_JUMP_PARTICLES, x, y);
  }

  burstCrash(x: number, y: number): void {
    this.crashBurst.explode(EFFECT_CRASH_PARTICLES, x, y);
  }

  burstCoin(x: number, y: number): void {
    this.coinBurst.explode(EFFECT_COIN_PARTICLES, x, y);
  }

  private createBurst(
    scene: Phaser.Scene,
    tint: number,
    speed: { min: number; max: number },
    lifespan: number,
    gravityY: number,
  ): Emitter {
    const emitter = scene.add.particles(0, 0, ASSET_KEYS.particle, {
      x: 0,
      y: 0,
      lifespan,
      speed,
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY,
      emitting: false,
      tint,
    });
    emitter.setDepth(6);
    return emitter;
  }
}
