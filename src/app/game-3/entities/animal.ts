import { ASSET_KEYS } from './asset-keys';
import { WOLF_TEXTURE_HEIGHT, WOLF_TEXTURE_WIDTH } from '../game-tunbles';

export enum AnimalKind {
  WOLF = 'WOLF',
}

export type AnimalAbility = 'doubleJump';

export interface AnimalConfig {
  kind: AnimalKind;
  textureKey: string;
  tint: number;
  speed: number;
  jumpPower: number;
  ability: AnimalAbility;
  /** Collision box in unscaled texture pixels; the wolf is drawn, not loaded. */
  body: { width: number; height: number; offsetX: number; offsetY: number };
}

export const ANIMAL_CONFIGS: Record<AnimalKind, AnimalConfig> = {
  [AnimalKind.WOLF]: {
    kind: AnimalKind.WOLF,
    textureKey: ASSET_KEYS.wolf,
    tint: 0x60a5fa,
    speed: 1.35,
    jumpPower: -520,
    ability: 'doubleJump',
    // Torso only: muzzle, tail and ear tips stay non-lethal so riding a wolf
    // never feels like being bitten by a hitbox.
    body: {
      width: WOLF_TEXTURE_WIDTH - 24,
      height: WOLF_TEXTURE_HEIGHT - 28,
      offsetX: 12,
      offsetY: 24,
    },
  },
};
