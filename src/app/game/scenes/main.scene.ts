import * as Phaser from 'phaser';

const PLAYER_SPEED = 240;
const PLAYER_MARGIN = 24;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private fpsText!: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('MainScene');
  }

  create(): void {
    this.player = this.add.rectangle(400, 300, 32, 32, 0x22c55e);
    this.player.setStrokeStyle(2, 0x166534);

    this.fpsText = this.add.text(8, 8, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#94a3b8',
    });

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
    }
  }

  override update(_time: number, delta: number): void {
    const cursors = this.cursors;
    if (!cursors) {
      return;
    }

    const dt = delta / 1000;
    const step = PLAYER_SPEED * dt;

    if (cursors.left.isDown) {
      this.player.x -= step;
    }
    if (cursors.right.isDown) {
      this.player.x += step;
    }
    if (cursors.up.isDown) {
      this.player.y -= step;
    }
    if (cursors.down.isDown) {
      this.player.y += step;
    }

    this.player.x = Phaser.Math.Clamp(
      this.player.x,
      PLAYER_MARGIN,
      this.scale.width - PLAYER_MARGIN,
    );

    this.player.y = Phaser.Math.Clamp(
      this.player.y,
      PLAYER_MARGIN,
      this.scale.height - PLAYER_MARGIN,
    );

    this.fpsText.setText(
      `FPS ${Math.round(this.game.loop.actualFps)}  |  Arrow keys move the player`,
    );
  }
}