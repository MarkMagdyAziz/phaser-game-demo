import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game.config';
import {
  LEVELS,
  LevelConfig,
  BOMB_SPAWN_Y,
  PLAYER_MOVE_VELOCITY,
  PLAYER_JUMP_VELOCITY,
  PLAYER_BOUNCE,
  STAR_VALUE,
  STAR_COUNT,
  STAR_STEP_X,
  TIME_BONUS_PER_SECOND,
} from '../game-tunbles';

type GameOverReason = 'bomb' | 'time-up';

interface LevelStartData {
  level?: number;
  carriedScore?: number;
}

interface DialogOptions {
  title: string;
  titleColor: string;
  subtitle: string;
  stats: string[];
  hint: string;
  onConfirm: () => void;
}

type ArcadePhysicsObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class FirstScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private stars!: Phaser.Physics.Arcade.Group;
  private bombs!: Phaser.Physics.Arcade.Group;

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  private level = 1;
  private levelConfig!: LevelConfig;
  private carriedScore = 0;

  private score = 0;
  private elapsedTime = 0;
  private timeLeft = 0;
  private gameIsOver = false;
  private bombTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('FirstScene');
  }

  init(data?: LevelStartData): void {
    this.level = Math.min(Math.max(1, data?.level ?? 1), LEVELS.length);
    this.levelConfig = LEVELS[this.level - 1];
    this.carriedScore = data?.carriedScore ?? 0;
  }

  preload(): void {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
  }

  create(): void {
    this.score = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.levelConfig.timeSeconds;
    this.gameIsOver = false;

    this.createBackground();
    this.createPlatforms();
    this.createPlayer();
    this.createAnimations();
    this.createInput();
    this.createStars();
    this.createBombs();
    this.createHud();
  }

  override update(_time: number, delta: number): void {
    if (this.gameIsOver) {
      return;
    }

    this.tickTimer(delta);
    if (this.gameIsOver) {
      return;
    }

    const cursors = this.cursors;
    const player = this.player;
    if (!cursors) {
      return;
    }

    if (cursors.left.isDown) {
      player.setVelocityX(-PLAYER_MOVE_VELOCITY);
      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(PLAYER_MOVE_VELOCITY);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  private createBackground(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky');
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    this.platforms
      .create(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'ground')
      .setScale(2)
      .refreshBody();
    this.platforms.create(600, 400, 'ground');
    this.platforms.create(50, 250, 'ground');
    this.platforms.create(GAME_WIDTH - 50, 220, 'ground');
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(100, 450, 'dude');
    this.player.setBounce(PLAYER_BOUNCE);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.platforms);
  }

  private createAnimations(): void {
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  private createInput(): void {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
    }
  }

  private createStars(): void {
    this.stars = this.physics.add.group({
      key: 'star',
      repeat: STAR_COUNT - 1,
      setXY: { x: 12, y: 0, stepX: STAR_STEP_X },
    });

    this.applyStarBounce();
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);
  }

  private createBombs(): void {
    this.bombs = this.physics.add.group();

    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);

    if (this.levelConfig.spawnInitialBomb) {
      this.spawnBomb();
    }

    if (this.levelConfig.bombIntervalMs > 0) {
      this.bombTimer = this.time.addEvent({
        delay: this.levelConfig.bombIntervalMs,
        loop: true,
        callback: this.spawnBomb,
        callbackScope: this,
      });
    }
  }

  private createHud(): void {
    this.scoreText = this.add
      .text(16, 16, `Score: ${this.score}`, { fontSize: '24px', color: '#ffffff' })
      .setDepth(10);

    this.levelText = this.add
      .text(GAME_WIDTH / 2, 16, `Level ${this.level}`, { fontSize: '24px', color: '#a78bfa' })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.timerText = this.add
      .text(GAME_WIDTH - 16, 16, '', { fontSize: '24px', color: '#fbbf24' })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private tickTimer(delta: number): void {
    this.elapsedTime += delta / 1000;
    this.timeLeft = Math.max(0, this.levelConfig.timeSeconds - this.elapsedTime);
    this.timerText.setText(`Time: ${this.timeLeft.toFixed(1)}s`);

    if (this.timeLeft <= 0) {
      this.endGame('time-up');
    }
  }

  private collectStar(_player: ArcadePhysicsObject, starObject: ArcadePhysicsObject): void {
    if (this.gameIsOver) {
      return;
    }

    const star = starObject as Phaser.Physics.Arcade.Image;
    star.disableBody(true, true);

    this.score += STAR_VALUE;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.score >= this.levelConfig.starsRequired * STAR_VALUE) {
      this.passLevel();
      return;
    }

    if (this.stars.countActive(true) === 0) {
      this.respawnStars();
    }
  }

  private applyStarBounce(): void {
    this.stars.children.forEach((child) => {
      const star = child as Phaser.Physics.Arcade.Image;
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
  }

  private respawnStars(): void {
    this.stars.children.forEach((child) => {
      const star = child as Phaser.Physics.Arcade.Image;
      star.enableBody(true, star.x, 0, true, true);
    });
  }

  private spawnBomb(): void {
    if (this.gameIsOver) {
      return;
    }

    const spawnFarFromPlayer =
      this.player.x < GAME_WIDTH / 2
        ? Phaser.Math.Between(GAME_WIDTH / 2, GAME_WIDTH)
        : Phaser.Math.Between(0, GAME_WIDTH / 2);

    const bomb = this.bombs.create(
      spawnFarFromPlayer,
      BOMB_SPAWN_Y,
      'bomb',
    ) as Phaser.Physics.Arcade.Image;
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }

  private hitBomb(_player: ArcadePhysicsObject, _bomb: ArcadePhysicsObject): void {
    if (this.gameIsOver) {
      return;
    }

    this.endGame('bomb');
  }

  private endGame(reason: GameOverReason): void {
    if (this.gameIsOver) {
      return;
    }

    this.gameIsOver = true;
    this.bombTimer?.remove();
    this.physics.pause();

    if (reason === 'bomb') {
      this.player.setTint(0xff0000);
      this.player.anims.play('turn');
    }

    const timeBonus = Math.floor(this.timeLeft * TIME_BONUS_PER_SECOND);
    const totalScore = this.carriedScore + this.score + timeBonus;
    const reasonLabel = reason === 'bomb' ? 'You hit a bomb!' : 'Time is up!';

    this.showDialog({
      title: 'GAME OVER',
      titleColor: '#f87171',
      subtitle: reasonLabel,
      stats: [`Stars: ${this.score}`, `Time bonus: +${timeBonus}`, `Total score: ${totalScore}`],
      hint: 'Press SPACE / ENTER or click to restart',
      onConfirm: () => this.scene.restart(),
    });
  }

  private passLevel(): void {
    if (this.gameIsOver) {
      return;
    }

    this.gameIsOver = true;
    this.bombTimer?.remove();
    this.physics.pause();
    this.player.anims.play('turn');

    const timeBonus = Math.floor(this.timeLeft * TIME_BONUS_PER_SECOND);
    const totalScore = this.carriedScore + this.score + timeBonus;
    const hasNextLevel = this.level < LEVELS.length;

    this.showDialog({
      title: hasNextLevel ? 'LEVEL PASSED' : 'YOU WIN!',
      titleColor: hasNextLevel ? '#4ade80' : '#fbbf24',
      subtitle: hasNextLevel ? `Level ${this.level} complete!` : 'All levels complete!',
      stats: [`Stars: ${this.score}`, `Time bonus: +${timeBonus}`, `Total score: ${totalScore}`],
      hint: `Press SPACE / ENTER or click ${hasNextLevel ? 'to continue' : 'to restart'}`,
      onConfirm: hasNextLevel
        ? () => this.scene.start('FirstScene', { level: this.level + 1, carriedScore: totalScore })
        : () => this.scene.restart({ level: 1, carriedScore: 0 }),
    });
  }

  private showDialog(options: DialogOptions): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setDepth(20);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 460, 320, 0x1e293b, 0.95).setDepth(21);

    this.add
      .text(GAME_WIDTH / 2, 190, options.title, {
        fontSize: '44px',
        color: options.titleColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.add
      .text(GAME_WIDTH / 2, 250, options.subtitle, { fontSize: '20px', color: '#f8fafc' })
      .setOrigin(0.5)
      .setDepth(22);

    this.add
      .text(GAME_WIDTH / 2, 310, options.stats.join('\n'), {
        fontSize: '22px',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.add
      .text(GAME_WIDTH / 2, 420, options.hint, { fontSize: '18px', color: '#94a3b8' })
      .setOrigin(0.5)
      .setDepth(22);
    this.input.once('pointerdown', options.onConfirm, this);
    this.input.keyboard?.once('keydown-ENTER', options.onConfirm, this);
    this.input.keyboard?.once('keydown-SPACE', options.onConfirm, this);
  }
}
