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

// === Phase 2c-1: パーティ戦システム ===

export type JobId = "warrior" | "monk" | "mage" | "youtuber";
export type PartyMemberId = "hero" | JobId;

export interface HeroState {
  name: string;
  nameSet: boolean;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
}

export interface JobBaseState {
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  unlocked: boolean;
}

export interface MageState extends JobBaseState {
  mp: number;
  maxMp: number;
}

export interface JobsState {
  warrior: JobBaseState;
  monk: JobBaseState;
  mage: MageState;
  youtuber: JobBaseState;
}

export interface PartyState {
  member1: "hero";
  member2: JobId | null;
  member3: JobId | null;
}

export interface LegacyCharsState {
  ownedIds: string[];
  levels: Record<string, { level: number; exp: number }>;
}

export interface SaveData {
  version: number;
  // Phase 2b 互換 (v2 のフィールドは v3 でも残す)
  ownedIds: string[];
  selectedId: string;
  levels: Record<string, number>;
  // 全 version で持つ
  gems: number;
  battleStage: number;
  gachaHistory: string[];
  // Phase 2c-1 で追加
  hero: HeroState;
  jobs: JobsState;
  party: PartyState;
  legacyChars: LegacyCharsState;
}
