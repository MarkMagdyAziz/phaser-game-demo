import { ASSET_KEYS } from '../asset-keys';

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
  stability: number;
  ability: AnimalAbility;
}

export const ANIMAL_CONFIGS: Record<AnimalKind, AnimalConfig> = {
  [AnimalKind.WOLF]: {
    kind: AnimalKind.WOLF,
    textureKey: ASSET_KEYS.wolf,
    tint: 0x60a5fa,
    speed: 1.35,
    jumpPower: -520,
    stability: 1.6,
    ability: 'doubleJump',
  },
};
