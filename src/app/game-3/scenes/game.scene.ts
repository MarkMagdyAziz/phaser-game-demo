import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../asset-keys';
import {
  AIR_HORIZONTAL_SPEED,
  CAMERA_DEADZONE_H,
  CAMERA_DEADZONE_W,
  CAMERA_LERP_X,
  CAMERA_LERP_Y,
  CHUNK_LOOK_AHEAD,
  CHUNK_KEEP_BEHIND,
  CHUNK_WIDTH,
  CRASH_COOLDOWN_MS,
  CRASH_TINT,
  DOWNHILL_PUSH,
  ENDLESS_WIDTH,
  LANDING_ALIGN_TOLERANCE,
  LANDING_LOCK_MS,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MOVE_VELOCITY,
  PLAYER_RAMP_LAUNCH_VELOCITY,
  PLAYER_SPAWN_X,
  SCORE_EVENT_STEP,
  SPIN_SPEED,
  SURFACE_AMP_LARGE,
  SURFACE_AMP_SMALL,
  SURFACE_MID_Y,
  SURFACE_PERIOD_LARGE,
  SURFACE_PERIOD_SMALL,
  SURFACE_TOLERANCE,
  WORLD_HEIGHT,
} from '../game-tunbles';
import { TerrainConfig, TerrainGenerator } from '../systems/terrain-generator';
import { ObstacleSystem } from '../systems/obstacle-system';
import { AnimalSystem } from '../systems/animal-system';
import { AnimalConfig, AnimalKind, ANIMAL_CONFIGS } from '../entities/animal';
import { CoinSystem } from '../systems/coin-system';
import { ScoreSystem } from '../systems/score-system';
import { DifficultySystem } from '../systems/difficulty-system';
import { BackgroundSystem } from '../systems/background-system';
import { EffectsSystem } from '../systems/effects-system';
import { AudioSystem } from '../systems/audio-system';
import { InputSystem } from '../systems/input-system';
import { GAME_EVENTS_KEY, GameEventBus, GameEventMap, GameEventName } from '../game-events';

const TERRAIN_CONFIG: TerrainConfig = {
  worldHeight: WORLD_HEIGHT,
  surfaceMidY: SURFACE_MID_Y,
  surfaceAmpLarge: SURFACE_AMP_LARGE,
  surfacePeriodLarge: SURFACE_PERIOD_LARGE,
  surfaceAmpSmall: SURFACE_AMP_SMALL,
  surfacePeriodSmall: SURFACE_PERIOD_SMALL,
};

const TAU = Math.PI * 2;

enum PlayerState {
  IDLE = 'IDLE',
  SKIING = 'SKIING',
  AIRBORNE = 'AIRBORNE',
  LANDING = 'LANDING',
  CRASHED = 'CRASHED',
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private terrain!: TerrainGenerator;
  private obstacleSystem!: ObstacleSystem;
  private animalSystem!: AnimalSystem;
  private coinSystem!: CoinSystem;
  private scoreSystem!: ScoreSystem;
  private difficulty!: DifficultySystem;
  private background!: BackgroundSystem;
  private effects!: EffectsSystem;
  private audio!: AudioSystem;
  private fpsText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private controls!: InputSystem;

  private playerState: PlayerState = PlayerState.IDLE;
  private wasGrounded = false;
  private landingLockTime = 0;
  private crashedUntil = 0;
  private runEnded = false;
  private lastScoredX = 0;
  private lastScoreBucket = -1;

  private mount: AnimalConfig | null = null;
  private jumpsUsed = 0;
  private airTimeSeconds = 0;

  private flips = 0;
  private airRotationDelta = 0;
  private prevAirRotation = 0;

  private chunkPool: Phaser.GameObjects.Graphics[] = [];
  private chunks = new Map<number, Phaser.GameObjects.Graphics>();

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.playerState = PlayerState.IDLE;
    this.wasGrounded = false;
    this.landingLockTime = 0;
    this.crashedUntil = 0;
    this.flips = 0;
    this.airRotationDelta = 0;
    this.prevAirRotation = 0;

    this.chunkPool = [];
    this.chunks = new Map();
    this.runEnded = false;
    this.mount = null;
    this.jumpsUsed = 0;
    this.airTimeSeconds = 0;
    this.lastScoredX = 0;
    this.lastScoreBucket = -1;
    this.scoreSystem = new ScoreSystem();
    this.difficulty = new DifficultySystem(PLAYER_SPAWN_X);

    this.createTerrain();
    this.obstacleSystem = new ObstacleSystem(this, this.terrain, (x) =>
      this.difficulty.obstacleDensityAt(x),
    );
    this.animalSystem = new AnimalSystem(this, this.terrain, (x) =>
      this.difficulty.animalDensityAt(x),
    );
    this.coinSystem = new CoinSystem(this, this.terrain);
    this.createPlayer();
    this.effects = new EffectsSystem(this);
    this.effects.follow(this.player);
    this.audio = new AudioSystem(this);
    this.createCamera();
    this.background = new BackgroundSystem(this);
    this.createHud();
    this.wireCollisions();

    const keyboard = this.input.keyboard;
    this.controls = new InputSystem(this);

    this.input.once('pointerdown', () => this.audio.startAmbient());
    keyboard?.once('keydown', () => this.audio.startAmbient());
    this.audio.startAmbient();

    this.emitEvent('GAME_STARTED', { time: 0 });
    this.emitEvent('GAME_PAUSED', { paused: false });
  }

  private emitEvent<K extends GameEventName>(event: K, payload?: GameEventMap[K]): void {
    const bus = this.registry.get(GAME_EVENTS_KEY) as GameEventBus | undefined;
    bus?.emit(event, payload);
  }

  private createTerrain(): void {
    this.terrain = new TerrainGenerator({
      ...TERRAIN_CONFIG,
      complexityAt: (x) => this.difficulty.terrainComplexityAt(x),
    });
  }

  private createPlayer(): void {
    const spawnX = PLAYER_SPAWN_X;
    this.player = this.physics.add.sprite(
      spawnX,
      this.terrain.surfaceYAt(spawnX) - 40,
      ASSET_KEYS.player,
    );
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.lastScoredX = this.player.x;
  }

  private createCamera(): void {
    this.physics.world.setBounds(0, 0, ENDLESS_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, ENDLESS_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE_W, CAMERA_DEADZONE_H);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP_X, CAMERA_LERP_Y);
  }

  private createHud(): void {
    this.scoreText = this.add
      .text(8, 6, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f1f5f9',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.fpsText = this.add
      .text(8, 32, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setScrollFactor(0)
      .setDepth(10);
  }

  override update(time: number, delta: number): void {
    this.background.update(this.cameras.main.scrollX, time);
    this.streamTerrain();
    this.obstacleSystem.update(
      this.cameras.main.scrollX,
      this.cameras.main.scrollX + this.scale.width,
    );
    this.animalSystem.update(
      this.cameras.main.scrollX,
      this.cameras.main.scrollX + this.scale.width,
    );
    this.coinSystem.update(this.cameras.main.scrollX, this.cameras.main.scrollX + this.scale.width);

    if (this.runEnded) {
      this.handleGameOverInput();
      return;
    }

    this.updatePlayer(time, delta);

    this.scoreText.setText(
      `SCORE ${this.scoreSystem.total}  |  Coins ${this.scoreSystem.collectedCoins}  |  Combo x${this.scoreSystem.comboMultiplier.toFixed(1)}`,
    );

    const total = this.scoreSystem.total;
    const bucket = Math.floor(total / SCORE_EVENT_STEP);
    if (bucket !== this.lastScoreBucket) {
      this.lastScoreBucket = bucket;
      this.emitEvent('SCORE_CHANGED', {
        score: total,
        coins: this.scoreSystem.collectedCoins,
        combo: this.scoreSystem.comboMultiplier,
      });
    }
    this.fpsText.setText(
      `FPS ${Math.round(this.game.loop.actualFps)}  |  State: ${this.playerState}  |  Flips: ${this.flips}  |  Mount: ${this.mount?.kind ?? 'NONE'}  |  Diff: ${Math.round(this.difficulty.progressAt(this.player.x) * 100)}%  |  Chunks: ${this.chunks.size}`,
    );
  }

  private streamTerrain(): void {
    const camLeft = this.cameras.main.scrollX;
    const camRight = camLeft + this.scale.width;
    const minIndex = Math.max(0, Math.floor(camLeft / CHUNK_WIDTH) - CHUNK_KEEP_BEHIND);
    const maxIndex = Math.floor(camRight / CHUNK_WIDTH) + CHUNK_LOOK_AHEAD;

    this.chunks.forEach((graphics, index) => {
      if (index < minIndex || index > maxIndex) {
        this.chunks.delete(index);
        graphics.setActive(false).setVisible(false);
        graphics.clear();
        this.chunkPool.push(graphics);
      }
    });

    for (let index = minIndex; index <= maxIndex; index++) {
      if (this.chunks.has(index)) {
        continue;
      }

      const startX = index * CHUNK_WIDTH;
      const endX = startX + CHUNK_WIDTH;
      let graphics = this.chunkPool.pop();
      if (graphics) {
        this.terrain.redrawChunk(graphics, startX, endX);
      } else {
        graphics = this.terrain.drawChunk(this, startX, endX);
      }
      graphics.setActive(true).setVisible(true);
      this.chunks.set(index, graphics);
    }
  }

  private updatePlayer(time: number, delta: number): void {
    const player = this.player;

    if (this.playerState === PlayerState.CRASHED) {
      if (time >= this.crashedUntil) {
        this.recoverFromCrash();
      } else {
        this.updateCrashedPlayer();
        return;
      }
    }

    const grounded = this.isPlayerGrounded();
    const dir = this.controls.left ? -1 : this.controls.right ? 1 : 0;
    const speedScale = this.mount?.speed ?? 1;

    this.trackScore(delta, grounded);

    if (grounded) {
      const downhill = DOWNHILL_PUSH * this.difficulty.speedScaleAt(player.x) * speedScale;
      player.setVelocityX(dir * PLAYER_MOVE_VELOCITY * speedScale + downhill);
      this.snapToSurface();
      player.setFlipX(dir < 0);
      this.jumpsUsed = 0;
    } else {
      player.setVelocityX(dir * AIR_HORIZONTAL_SPEED * speedScale);
    }

    this.effects.update(grounded, player.body.velocity.x);
    this.audio.setSkiing(grounded && Math.abs(player.body.velocity.x) > 30);

    if (this.controls.jumpJustPressed()) {
      const maxJumps = this.mount?.ability === 'doubleJump' ? 2 : 1;
      if (grounded) {
        this.jumpsUsed = 1;
        player.setVelocityY(this.currentJumpPower);
        this.effects.burstJump(player.x, player.body.bottom);
        this.audio.playJump();
        this.beginJump();
      } else if (this.jumpsUsed < maxJumps) {
        this.jumpsUsed += 1;
        player.setVelocityY(this.currentJumpPower);
        this.effects.burstJump(player.x, player.body.bottom);
        this.audio.playJump();
      }
    }

    if (!grounded) {
      const spinDir = this.controls.right ? 1 : this.controls.left ? -1 : 0;
      player.rotation += spinDir * SPIN_SPEED * (delta / 1000);
      this.trackFlips();
    }

    const wasGrounded = this.wasGrounded;
    this.wasGrounded = grounded;
    this.updatePlayerState(time, grounded, wasGrounded);

    if (this.playerState === PlayerState.CRASHED) {
      return;
    }

    if (grounded) {
      const target = this.terrain.slopeAngleAt(player.x);
      player.rotation = Phaser.Math.Linear(player.rotation, target, 0.25);
    }
  }

  private trackScore(delta: number, grounded: boolean): void {
    const dx = this.player.x - this.lastScoredX;
    this.scoreSystem.addDistance(dx);
    this.lastScoredX = this.player.x;
    if (!grounded) {
      this.airTimeSeconds += delta / 1000;
    }
  }

  private isPlayerGrounded(): boolean {
    const body = this.player.body;
    const surfaceY = this.terrain.surfaceYAt(this.player.x);
    return body.velocity.y >= 0 && body.bottom >= surfaceY - SURFACE_TOLERANCE;
  }

  private snapToSurface(): void {
    const body = this.player.body;
    const surfaceY = this.terrain.surfaceYAt(this.player.x);
    body.y = surfaceY - body.halfHeight;
    body.setVelocityY(0);
  }

  private beginJump(): void {
    this.airRotationDelta = 0;
    this.prevAirRotation = this.player.rotation;
    this.flips = 0;
  }

  private trackFlips(): void {
    this.airRotationDelta += this.player.rotation - this.prevAirRotation;
    this.prevAirRotation = this.player.rotation;
    this.flips = Math.floor(Math.abs(this.airRotationDelta) / TAU);
  }

  private updatePlayerState(time: number, grounded: boolean, wasGrounded: boolean): void {
    if (!grounded) {
      this.playerState = PlayerState.AIRBORNE;
      return;
    }

    if (!wasGrounded && this.handleLanding(time)) {
      return;
    }

    if (time < this.landingLockTime) {
      this.playerState = PlayerState.LANDING;
      return;
    }

    this.playerState = this.player.body.velocity.x === 0 ? PlayerState.IDLE : PlayerState.SKIING;
  }

  private handleLanding(time: number): boolean {
    const deviation = Math.abs(
      Phaser.Math.Angle.Wrap(this.player.rotation - this.terrain.slopeAngleAt(this.player.x)),
    );

    if (deviation > this.currentLandingTolerance) {
      if (this.mount) {
        this.dismountAnimal();
        this.scoreSystem.breakCombo();
        this.airTimeSeconds = 0;
        this.airRotationDelta = 0;
        this.landingLockTime = time + LANDING_LOCK_MS;
        return false;
      }
      this.triggerCrash(time);
      return true;
    }

    this.flips = Math.floor(Math.abs(this.airRotationDelta) / TAU);
    this.scoreSystem.registerLanding({
      flips: this.flips,
      airTimeSeconds: this.airTimeSeconds,
    });
    this.effects.burstLanding(this.player.x, this.player.body.bottom);
    this.audio.playLanding();
    if (this.flips > 0) {
      this.audio.playCombo();
    }
    this.airTimeSeconds = 0;
    this.airRotationDelta = 0;
    this.landingLockTime = time + LANDING_LOCK_MS;
    return false;
  }

  private get currentJumpPower(): number {
    return this.mount?.jumpPower ?? PLAYER_JUMP_VELOCITY;
  }

  private get currentLandingTolerance(): number {
    return LANDING_ALIGN_TOLERANCE * (this.mount?.stability ?? 1);
  }

  private triggerCrash(time: number): void {
    this.playerState = PlayerState.CRASHED;
    this.crashedUntil = time + CRASH_COOLDOWN_MS;
    this.flips = 0;
    this.airRotationDelta = 0;
    this.airTimeSeconds = 0;
    this.scoreSystem.breakCombo();
    this.player.setTint(CRASH_TINT);
    this.player.setVelocityX(0);
    this.effects.stopTrail();
    this.effects.burstCrash(this.player.x, this.player.y);
    this.audio.setSkiing(false);
    this.audio.playCrash();
    this.emitEvent('PLAYER_CRASHED', { cause: 'bad-landing' });
    this.cameras.main.shake(160, 0.006);
  }

  private updateCrashedPlayer(): void {
    if (!this.isPlayerGrounded()) {
      return;
    }
    this.snapToSurface();
    this.player.setVelocityX(0);
  }

  private recoverFromCrash(): void {
    this.player.clearTint();
    this.snapToSurface();
    this.player.rotation = this.terrain.slopeAngleAt(this.player.x);
    this.playerState = PlayerState.SKIING;
  }

  private wireCollisions(): void {
    this.physics.add.overlap(this.player, this.obstacleSystem.solidGroups, () =>
      this.hitObstacle(),
    );
    this.physics.add.overlap(this.player, this.obstacleSystem.rampGroup, () =>
      this.launchFromRamp(),
    );
    this.physics.add.overlap(this.player, this.animalSystem.group, (_player, animal) =>
      this.mountAnimal(animal as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.player, this.coinSystem.group, (_player, coin) =>
      this.collectCoin(coin as Phaser.Physics.Arcade.Sprite),
    );
  }

  private collectCoin(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (this.runEnded) {
      return;
    }
    this.scoreSystem.addCoins(1);
    this.effects.burstCoin(sprite.x, sprite.y);
    this.audio.playCoin();
    this.coinSystem.collect(sprite);
  }

  private mountAnimal(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (this.runEnded || this.playerState === PlayerState.CRASHED || this.mount) {
      return;
    }
    const kind = sprite.getData('animalKind') as AnimalKind;
    const config = ANIMAL_CONFIGS[kind];
    this.mount = config;
    this.jumpsUsed = 0;
    this.player.setTint(config.tint);
    this.animalSystem.consume(sprite);
    this.emitEvent('PLAYER_MOUNTED', { kind });
  }

  private dismountAnimal(): void {
    this.mount = null;
    this.jumpsUsed = 0;
    this.player.clearTint();
  }

  private hitObstacle(): void {
    if (this.runEnded || this.playerState === PlayerState.CRASHED) {
      return;
    }
    this.endRun('You crashed into an obstacle!');
  }

  private launchFromRamp(): void {
    if (this.runEnded || this.playerState === PlayerState.CRASHED) {
      return;
    }
    if (!this.isPlayerGrounded()) {
      return;
    }
    this.player.setVelocityY(PLAYER_RAMP_LAUNCH_VELOCITY);
    this.jumpsUsed = 1;
    this.beginJump();
  }

  private endRun(reason: string): void {
    if (this.runEnded) {
      return;
    }
    this.runEnded = true;
    this.player.setTint(CRASH_TINT);
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.effects.stopTrail();
    this.effects.burstCrash(this.player.x, this.player.y);
    this.audio.setSkiing(false);
    this.audio.playCrash();
    this.emitEvent('PLAYER_CRASHED', { cause: reason });
    this.emitEvent('GAME_OVER', { score: this.scoreSystem.total, reason });
    this.emitEvent('GAME_PAUSED', { paused: true });
    this.cameras.main.shake(300, 0.008);

    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(0, 0, w, h, 0x0b1220, 0.72).setOrigin(0).setScrollFactor(0).setDepth(20);
    this.add
      .text(
        w / 2,
        h / 2,
        `GAME OVER\n\nScore: ${this.scoreSystem.total}\n${reason}\n\nPress R to ski again`,
        {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#f8fafc',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);
  }

  private handleGameOverInput(): void {
    if (this.controls.restartJustPressed()) {
      this.emitEvent('GAME_RESTARTED');
      this.audio.playUiClick();
      this.scene.restart();
    }
  }
}
