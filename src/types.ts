export type Rarity = 3 | 4 | 5;

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
}

export interface SaveData {
  ownedIds: string[];
  gems: number;
  battleStage: number;
  gachaHistory: string[];
}
