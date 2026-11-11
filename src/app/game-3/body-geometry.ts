/**
 * Arcade body size + offset, in unscaled texture pixels.
 *
 * Kept free of Phaser imports so the arithmetic can be unit tested without a
 * canvas. `asset-specs.ts` turns these into an actual Arcade body.
 */
export interface AssetBody {
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Converts texture-pixel body values into world pixels.
 *
 * Needed because the two Arcade body types disagree: a dynamic `Body` keeps the
 * numbers as source pixels and multiplies by the sprite scale itself, while
 * `StaticBody.setSize` takes world pixels and never scales.
 */
export function scaleBody(body: AssetBody, scale: number): AssetBody {
  return {
    width: body.width * scale,
    height: body.height * scale,
    offsetX: body.offsetX * scale,
    offsetY: body.offsetY * scale,
  };
}
