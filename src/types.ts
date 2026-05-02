export type Rarity = 3 | 4 | 5;

export interface SpriteConfig {
  idleSrc: string;
  attackSrc: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  idleDuration: number;
  attackDuration: number;
}

export interface Character {
  id: string;
  name: string;
  hp: number;
  attack: number;
  skillName: string;
  skillPower: number;
  rarity: Rarity;
  color: string;
  emoji: string;
  sprite?: SpriteConfig;
}

export interface SaveData {
  version: number;
  ownedIds: string[];
  selectedId: string;
  levels: Record<string, number>;
  gems: number;
  battleStage: number;
  gachaHistory: string[];
}
