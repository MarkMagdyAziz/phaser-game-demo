import * as Phaser from 'phaser';
import { ASSET_KEYS, FONT_FAMILIES } from '../entities/asset-keys';
import { applyAssetSpec } from '../asset-specs';
import {
  CAMERA_DEADZONE_H,
  CAMERA_DEADZONE_W,
  CAMERA_LERP_X,
  CAMERA_LERP_Y,
  CHUNK_LOOK_AHEAD,
  CHUNK_KEEP_BEHIND,
  CHUNK_WIDTH,
  CRASH_TINT,
  DOWNHILL_PUSH,
  ENDLESS_WIDTH,
  HUD_MUTED_TEXT_SIZE,
  HUD_PANEL_HEIGHT,
  HUD_PANEL_WIDTH,
  HUD_TEXT_SIZE,
  MIN_FORWARD_SPEED,
  OVERLAY_TEXT_SIZE,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MOVE_VELOCITY,
  PLAYER_RAMP_LAUNCH_VELOCITY,
  PLAYER_SCALE,
  PLAYER_SPAWN_X,
  SCORE_EVENT_STEP,
  SURFACE_AMP_LARGE,
  SURFACE_AMP_SMALL,
  SURFACE_MID_Y,
  SURFACE_PERIOD_LARGE,
  SURFACE_PERIOD_SMALL,
  SURFACE_TOLERANCE,
  WOLF_RIDE_DISTANCE,
  WORLD_HEIGHT,
} from '../game-tunbles';
import { TerrainChunk, TerrainConfig, TerrainGenerator } from '../systems/terrain-generator';
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
import { GameEventBus } from '../game-events';
import { GAME_EVENTS_KEY, GameEventMap, GameEventName } from '../entities/events';

const TERRAIN_CONFIG: TerrainConfig = {
  worldHeight: WORLD_HEIGHT,
  surfaceMidY: SURFACE_MID_Y,
  surfaceAmpLarge: SURFACE_AMP_LARGE,
  surfacePeriodLarge: SURFACE_PERIOD_LARGE,
  surfaceAmpSmall: SURFACE_AMP_SMALL,
  surfacePeriodSmall: SURFACE_PERIOD_SMALL,
};

enum PlayerState {
  SKIING = 'SKIING',
  AIRBORNE = 'AIRBORNE',
}

/** Kenney frame per state. All frames share one 84x98 canvas, so switching
 *  texture never disturbs the Arcade body. */
const STATE_FRAME: Record<PlayerState, string> = {
  [PlayerState.SKIING]: ASSET_KEYS.skierRide,
  [PlayerState.AIRBORNE]: ASSET_KEYS.skierAir,
};

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

  private playerState: PlayerState = PlayerState.SKIING;
  private wasGrounded = false;
  private runEnded = false;
  private lastScoredX = 0;
  private lastScoreBucket = -1;

  private mount: AnimalConfig | null = null;
  private mountX = 0;
  private jumpsUsed = 0;
  private airTimeSeconds = 0;

  private chunkPool: TerrainChunk[] = [];
  private chunks = new Map<number, TerrainChunk>();

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.playerState = PlayerState.SKIING;
    this.wasGrounded = false;

    this.chunkPool = [];
    this.chunks = new Map();
    this.runEnded = false;
    this.mount = null;
    this.mountX = 0;
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
    const texture = ASSET_KEYS.skierRide;
    // Spawn on the surface, already sliding: spawning above it left the player
    // in the air pose for the first ~0.7s with no forward movement.
    this.player = this.physics.add.sprite(spawnX, this.terrain.surfaceYAt(spawnX), texture);
    applyAssetSpec(this.player, texture, PLAYER_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.snapToSurface();
    this.player.setVelocityX(DOWNHILL_PUSH);
    // Spawning grounded means the first update() would otherwise treat it as a
    // landing and award a phantom landing + combo.
    this.wasGrounded = true;
    this.lastScoredX = this.player.x;
  }

  private createCamera(): void {
    this.physics.world.setBounds(0, 0, ENDLESS_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, ENDLESS_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE_W, CAMERA_DEADZONE_H);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP_X, CAMERA_LERP_Y);
  }

  private createHud(): void {
    this.add
      .nineslice(
        8,
        6,
        ASSET_KEYS.uiPanelDark,
        undefined,
        HUD_PANEL_WIDTH,
        HUD_PANEL_HEIGHT,
        18,
        18,
        18,
        18,
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(9);

    this.scoreText = this.add
      .text(18, 14, '', {
        fontFamily: FONT_FAMILIES.future,
        fontSize: `${HUD_TEXT_SIZE}px`,
        color: '#f1f5f9',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.fpsText = this.add
      .text(18, 34, '', {
        fontFamily: FONT_FAMILIES.pixel,
        fontSize: `${HUD_MUTED_TEXT_SIZE}px`,
        color: '#cbd5e1',
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

    this.updatePlayer(delta);
    this.applyPlayerFrame();

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
      `FPS ${Math.round(this.game.loop.actualFps)}  |  State: ${this.playerState}  |  Mount: ${this.mount?.kind ?? 'NONE'}  |  Diff: ${Math.round(this.difficulty.progressAt(this.player.x) * 100)}%  |  Chunks: ${this.chunks.size}`,
    );
  }

  private streamTerrain(): void {
    const camLeft = this.cameras.main.scrollX;
    const camRight = camLeft + this.scale.width;
    const minIndex = Math.max(0, Math.floor(camLeft / CHUNK_WIDTH) - CHUNK_KEEP_BEHIND);
    const maxIndex = Math.floor(camRight / CHUNK_WIDTH) + CHUNK_LOOK_AHEAD;

    this.chunks.forEach((chunk, index) => {
      if (index < minIndex || index > maxIndex) {
        this.chunks.delete(index);
        this.terrain.hideCrust(chunk);
        chunk.fill.setActive(false).setVisible(false).clear();
        this.chunkPool.push(chunk);
      }
    });

    for (let index = minIndex; index <= maxIndex; index++) {
      if (this.chunks.has(index)) {
        continue;
      }

      const startX = index * CHUNK_WIDTH;
      const endX = startX + CHUNK_WIDTH;
      let chunk = this.chunkPool.pop();
      if (chunk) {
        this.terrain.redrawChunk(chunk, startX, endX);
      } else {
        chunk = this.terrain.drawChunk(this, startX, endX);
      }
      chunk.fill.setActive(true).setVisible(true);
      this.chunks.set(index, chunk);
    }
  }

  /**
   * Swaps the Kenney frame to match the current state. Every frame shares one
   * canvas and one body, so the switch is purely cosmetic. There is no walk
   * cycle: the ride frame is a static crouch.
   */
  private applyPlayerFrame(): void {
    const frame = STATE_FRAME[this.playerState];
    if (this.player.texture.key === frame) {
      return;
    }
    this.player.setTexture(frame);
    applyAssetSpec(this.player, frame, PLAYER_SCALE);
  }

  private updatePlayer(delta: number): void {
    const player = this.player;
    const grounded = this.isPlayerGrounded();
    const dir = this.controls.left ? -1 : this.controls.right ? 1 : 0;
    const speedScale = this.mount?.speed ?? 1;

    this.trackScore(delta, grounded);
    this.updateMount();

    const groundSpeed = dir * PLAYER_MOVE_VELOCITY * speedScale;
    const downhill = DOWNHILL_PUSH * this.difficulty.speedScaleAt(player.x) * speedScale;

    // Forward-only: the world begins at x = 0, so a net-left velocity would pin
    // the player against the wall and read as running in place.
    const steerSpeed = Math.max(groundSpeed + downhill, MIN_FORWARD_SPEED);

    if (grounded) {
      player.setVelocityX(steerSpeed);
      this.snapToSurface();
      this.jumpsUsed = 0;
    } else if (dir !== 0) {
      // Keep the launch momentum and steer toward the grounded velocity for that
      // direction, instead of snapping to a fixed air speed, which stalled jumps.
      player.setVelocityX(Phaser.Math.Linear(player.body.velocity.x, steerSpeed, 0.05));
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
      } else if (this.jumpsUsed < maxJumps) {
        this.jumpsUsed += 1;
        player.setVelocityY(this.currentJumpPower);
        this.effects.burstJump(player.x, player.body.bottom);
        this.audio.playJump();
      }
    }

    const wasGrounded = this.wasGrounded;
    this.wasGrounded = grounded;
    this.updatePlayerState(grounded, wasGrounded);
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
    if (body.velocity.y < 0) {
      return false;
    }
    // A fast downhill drops the surface ~2.7px per frame while gravity only
    // moves the body ~0.08px, so a fixed 2px window un-grounded the player on
    // every steep section and collapsed its speed. Widen the window with speed.
    const slack = SURFACE_TOLERANCE + Math.abs(body.velocity.x) * 0.02;
    return body.bottom >= this.terrain.surfaceYAt(this.player.x) - slack;
  }

  private snapToSurface(): void {
    const body = this.player.body;
    // body.y is the body's TOP edge, so subtracting the full height puts the
    // feet on the snow. Using halfHeight buried the body half a box deep, which
    // also put its top edge above the coin pickup band.
    body.y = this.terrain.surfaceYAt(this.player.x) - body.height;
    body.setVelocityY(0);
  }

  private updatePlayerState(grounded: boolean, wasGrounded: boolean): void {
    if (!grounded) {
      this.playerState = PlayerState.AIRBORNE;
      return;
    }

    if (!wasGrounded) {
      this.handleLanding();
    }

    this.playerState = PlayerState.SKIING;
  }

  /**
   * Every touchdown counts. Without sprite rotation there is no landing angle to
   * judge, so the only ways to lose are obstacles and rocks.
   */
  private handleLanding(): void {
    this.scoreSystem.registerLanding({ airTimeSeconds: this.airTimeSeconds });
    this.effects.burstLanding(this.player.x, this.player.body.bottom);
    this.audio.playLanding();
    this.airTimeSeconds = 0;
  }

  /** The wolf bolts after carrying the player for a while. */
  private updateMount(): void {
    if (this.mount && this.player.x - this.mountX >= WOLF_RIDE_DISTANCE) {
      this.dismountAnimal();
    }
  }

  private get currentJumpPower(): number {
    return this.mount?.jumpPower ?? PLAYER_JUMP_VELOCITY;
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
    if (this.runEnded || this.mount) {
      return;
    }
    const kind = sprite.getData('animalKind') as AnimalKind;
    const config = ANIMAL_CONFIGS[kind];
    this.mount = config;
    this.mountX = this.player.x;
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
    if (this.runEnded) {
      return;
    }
    this.endRun('You crashed into an obstacle!');
  }

  private launchFromRamp(): void {
    if (this.runEnded) {
      return;
    }
    if (!this.isPlayerGrounded()) {
      return;
    }
    this.player.setVelocityY(PLAYER_RAMP_LAUNCH_VELOCITY);
    this.jumpsUsed = 1;
  }

  private endRun(reason: string): void {
    if (this.runEnded) {
      return;
    }
    this.runEnded = true;
    this.player.setTexture(ASSET_KEYS.skierCrash);
    applyAssetSpec(this.player, ASSET_KEYS.skierCrash, PLAYER_SCALE);
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
      .image(w / 2, h / 2 - 118, ASSET_KEYS.uiBanner)
      .setOrigin(0.5)
      .setScale(1.7)
      .setScrollFactor(0)
      .setDepth(21);

    this.add
      .text(w / 2, h / 2 - 118, 'GAME OVER', {
        fontFamily: FONT_FAMILIES.future,
        fontSize: '26px',
        color: '#0f172a',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(22);

    this.add
      .text(
        w / 2,
        h / 2 + 16,
        `Score: ${this.scoreSystem.total}\nCoins: ${this.scoreSystem.collectedCoins}\n\n${reason}\n\nPress R to ski again`,
        {
          fontFamily: FONT_FAMILIES.future,
          fontSize: `${OVERLAY_TEXT_SIZE}px`,
          color: '#f8fafc',
          align: 'center',
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(22);
  }

  private handleGameOverInput(): void {
    if (this.controls.restartJustPressed()) {
      this.emitEvent('GAME_RESTARTED');
      this.audio.playUiClick();
      this.scene.restart();
    }
  }
}
