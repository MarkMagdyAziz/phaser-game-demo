import * as Phaser from 'phaser';
import { TOUCH_BUTTON_RADIUS, TOUCH_SWIPE_JUMP_DISTANCE } from '../game-tunbles';

type MovementKeys = Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

export class InputSystem {
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: MovementKeys;
  private readonly restartKey?: Phaser.Input.Keyboard.Key;

  private virtualLeft = false;
  private virtualRight = false;
  private virtualJump = false;
  private swipeJumpQueued = false;
  private previousJumpHeld = false;
  private swipeStartY = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = keyboard.addKeys('W,A,S,D') as MovementKeys;
      this.restartKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    this.createTouchControls();
  }

  get left(): boolean {
    return Boolean(this.cursors?.left.isDown || this.wasd?.A.isDown || this.virtualLeft);
  }

  get right(): boolean {
    return Boolean(this.cursors?.right.isDown || this.wasd?.D.isDown || this.virtualRight);
  }

  jumpJustPressed(): boolean {
    const held = this.isJumpHeld();
    const keyboardEdge = held && !this.previousJumpHeld;
    this.previousJumpHeld = held;

    if (this.swipeJumpQueued) {
      this.swipeJumpQueued = false;
      return true;
    }
    return keyboardEdge;
  }

  restartJustPressed(): boolean {
    return this.restartKey ? Phaser.Input.Keyboard.JustDown(this.restartKey) : false;
  }

  private isJumpHeld(): boolean {
    return Boolean(
      this.cursors?.up.isDown ||
      this.cursors?.space.isDown ||
      this.wasd?.W.isDown ||
      this.virtualJump,
    );
  }

  private createTouchControls(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartY = pointer.y;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.virtualLeft = false;
      this.virtualRight = false;
      this.virtualJump = false;
      if (this.swipeStartY - pointer.y >= TOUCH_SWIPE_JUMP_DISTANCE) {
        this.swipeJumpQueued = true;
      }
    });

    if (!this.scene.sys.game.device.input.touch) {
      return;
    }

    const { width, height } = this.scene.scale;
    const y = height - TOUCH_BUTTON_RADIUS - 20;

    this.createButton(TOUCH_BUTTON_RADIUS + 20, y, '◀', () => {
      this.virtualLeft = true;
    });
    this.createButton(TOUCH_BUTTON_RADIUS * 3 + 40, y, '▶', () => {
      this.virtualRight = true;
    });
    this.createButton(width - TOUCH_BUTTON_RADIUS - 20, y, 'JUMP', () => {
      this.virtualJump = true;
    });
  }

  private createButton(x: number, y: number, label: string, onPress: () => void): void {
    const radius = TOUCH_BUTTON_RADIUS;

    this.scene.add
      .circle(x, y, radius, 0x0f172a, 0.35)
      .setStrokeStyle(2, 0xe2e8f0, 0.5)
      .setScrollFactor(0)
      .setDepth(30);
    this.scene.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31);

    const half = radius + 12;
    this.scene.add
      .zone(x, y, half * 2, half * 2)
      .setScrollFactor(0)
      .setDepth(32)
      .setInteractive(new Phaser.Geom.Circle(half, half, half), Phaser.Geom.Circle.Contains)
      .on('pointerdown', onPress);
  }
}
