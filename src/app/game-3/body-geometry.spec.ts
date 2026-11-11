import { AssetBody, scaleBody } from './body-geometry';

/**
 * Guards the numbers that decide whether pickups and obstacle trunks work.
 * These broke twice silently (a refreshBody() wiping the body, then a half-buried
 * player body), so they are pinned here.
 */

// Mirrors PLAYER_BODY in asset-specs.ts and PLAYER_SCALE in game-tunbles.ts.
const PLAYER_BODY: AssetBody = { width: 28, height: 48, offsetX: 28, offsetY: 50 };
const PLAYER_SCALE = 0.62;
const PLAYER_DISPLAY_HEIGHT = 98 * PLAYER_SCALE;

// Mirrors COIN_BODY in asset-specs.ts, COIN_SCALE and COIN_SURFACE_OFFSET.
const COIN_BODY: AssetBody = { width: 52, height: 72, offsetX: -7, offsetY: -16 };
const COIN_SCALE = 0.8;
const COIN_DISPLAY_HEIGHT = 40 * COIN_SCALE;
const COIN_SURFACE_OFFSET = 34;

// Mirrors TRUNK_BODY and OBSTACLE_SCALE.
const TRUNK_BODY: AssetBody = { width: 20, height: 268, offsetX: 10, offsetY: 0 };
const OBSTACLE_SCALE = 0.55;
const TREE_DISPLAY_WIDTH = 41 * OBSTACLE_SCALE;

const SURFACE_Y = 400;

interface Span {
  readonly top: number;
  readonly bottom: number;
}

/** Vertical span of a body whose top edge was placed at `top`. */
function span(top: number, height: number): Span {
  return { top, bottom: top + height };
}

function overlaps(a: Span, b: Span): boolean {
  return a.top < b.bottom && b.top < a.bottom;
}

describe('body geometry', () => {
  it('scales texture-pixel values into world pixels', () => {
    const coin = scaleBody(COIN_BODY, COIN_SCALE);

    expect(coin.width).toBeCloseTo(41.6);
    expect(coin.height).toBeCloseTo(57.6);
    expect(coin.offsetX).toBeCloseTo(-5.6);
    expect(coin.offsetY).toBeCloseTo(-12.8);
  });

  it('lets a grounded player reach a coin pickup box', () => {
    // snapToSurface() puts the body's top at surfaceY - height.
    const player = scaleBody(PLAYER_BODY, PLAYER_SCALE);
    const playerSpan = span(SURFACE_Y - player.height, player.height);

    // The coin sprite is centred COIN_SURFACE_OFFSET above the surface; its
    // static body then shifts by the scaled offset.
    const coin = scaleBody(COIN_BODY, COIN_SCALE);
    const coinTop = SURFACE_Y - COIN_SURFACE_OFFSET - COIN_DISPLAY_HEIGHT / 2 + coin.offsetY;
    const coinSpan = span(coinTop, coin.height);

    expect(overlaps(playerSpan, coinSpan)).toBe(true);
  });

  it('keeps the tree hitbox on the trunk, not the canopy', () => {
    const trunk = scaleBody(TRUNK_BODY, OBSTACLE_SCALE);

    expect(trunk.width).toBeLessThan(TREE_DISPLAY_WIDTH);
    expect(trunk.height).toBeCloseTo(268 * OBSTACLE_SCALE);
  });
});
