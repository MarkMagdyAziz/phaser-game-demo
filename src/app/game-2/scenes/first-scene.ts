import * as Phaser from 'phaser';

const PLAYER_SPEED = 240;
const PLAYER_MARGIN = 24;

export class FirstScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private fpsText!: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private bombs!: Phaser.Physics.Arcade.Group;
  private gameeIsOver = false;
  private stars!: Phaser.Physics.Arcade.Group;
  constructor() {
    super('FirstScene');
  }

  create() {
    // add background images and start
    this.add.image(400, 300, 'sky');

    // create platforms
    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'ground');
    this.platforms.create(50, 250, 'ground');
    this.platforms.create(750, 220, 'ground');

    // create the player
    this.player = this.physics.add.sprite(100, 450, 'dude');
    this.player.setBounce(0.4);
    this.player.setCollideWorldBounds(true);

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

    // init the keyboard inputs
    const keyboard = this.input.keyboard;

    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
    }

    // starts
    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.forEach((child) => {
      const star = child as Phaser.Physics.Arcade.Image;
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);

    // score text
    this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px' });

    // bombs
    this.bombs = this.physics.add.group();

    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);
        this.physics.add.collider(this.player, this.platforms);

  }

  override update(_time: number, delta: number): void {
    const cursors = this.cursors;
    const player = this.player;
    if (!cursors) {
      return;
    }

    if (cursors.left.isDown) {
      player.setVelocityX(-160);

      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);

      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);

      player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
  }

  collectStar(player: any, star: any) {
    star.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    if (this.stars.countActive(true) === 0) {
      this.stars.children.forEach((child) => {
        const star = child as Phaser.Physics.Arcade.Image;
        star.enableBody(true, star.x, 0, true, true);
      });

      var x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }
  hitBomb(player: any, bomb: any) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    this.gameeIsOver = true;

  }
}
