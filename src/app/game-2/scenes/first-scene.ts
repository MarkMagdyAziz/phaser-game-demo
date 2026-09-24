import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game.config';

// Gameplay tunables
const PLAYER_MOVE_VELOCITY = 160;
const PLAYER_JUMP_VELOCITY = -330;
const PLAYER_BOUNCE = 0.4;
const STAR_VALUE = 10;
const STAR_COUNT = 12;
const STAR_STEP_X = 70;
const START_TIME_SECONDS = 60;
const TIME_BONUS_PER_SECOND = 5;
const BOMB_SPAWN_Y = 16;

type GameOverReason = 'bomb' | 'time-up';

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

  private score = 0;
  private elapsedTime = 0;
  private timeLeft = START_TIME_SECONDS;
  private gameIsOver = false;

  constructor() {
    super('FirstScene');
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
    this.timeLeft = START_TIME_SECONDS;
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
  }

  private createHud(): void {
    this.scoreText = this.add
      .text(16, 16, `Score: ${this.score}`, { fontSize: '24px', color: '#ffffff' })
      .setDepth(10);

    this.timerText = this.add
      .text(GAME_WIDTH - 16, 16, '', { fontSize: '24px', color: '#fbbf24' })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private tickTimer(delta: number): void {
    this.elapsedTime += delta / 1000;
    this.timeLeft = Math.max(0, START_TIME_SECONDS - this.elapsedTime);
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

    if (this.stars.countActive(true) === 0) {
      this.respawnStars();
      this.spawnBomb();
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
    this.physics.pause();

    if (reason === 'bomb') {
      this.player.setTint(0xff0000);
      this.player.anims.play('turn');
    }

    const timeBonus = Math.floor(this.timeLeft * TIME_BONUS_PER_SECOND);
    const finalScore = this.score + timeBonus;
    const reasonLabel = reason === 'bomb' ? 'You hit a bomb!' : 'Time is up!';

    this.showGameOverOverlay(reasonLabel, timeBonus, finalScore);
    this.registerRestartTriggers();
  }

  private showGameOverOverlay(reasonLabel: string, timeBonus: number, finalScore: number): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setDepth(20);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 460, 300, 0x1e293b, 0.95).setDepth(21);

    this.add
      .text(GAME_WIDTH / 2, 210, 'GAME OVER', {
        fontSize: '48px',
        color: '#f87171',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.add
      .text(GAME_WIDTH / 2, 270, reasonLabel, { fontSize: '20px', color: '#f8fafc' })
      .setOrigin(0.5)
      .setDepth(22);

    this.add
      .text(
        GAME_WIDTH / 2,
        320,
        `Stars: ${this.score}\nTime bonus: +${timeBonus}\nFinal score: ${finalScore}`,
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 10 },
      )
      .setOrigin(0.5)
      .setDepth(22);

    this.add
      .text(GAME_WIDTH / 2, 400, 'Press SPACE / ENTER or click to restart', {
        fontSize: '18px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setDepth(22);
  }

  private registerRestartTriggers(): void {
    this.input.once('pointerdown', this.restartGame, this);
    this.input.keyboard?.once('keydown-ENTER', this.restartGame, this);
    this.input.keyboard?.once('keydown-SPACE', this.restartGame, this);
  }

  private restartGame(): void {
    this.scene.restart();
  }
}
