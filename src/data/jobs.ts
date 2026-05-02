import type { JobId, PartyMemberId } from "../types";

export const YOUTUBER_DISPLAY_NAME = "ユーチューバー";

export interface JobMaster {
  id: JobId;
  displayName: string;
  emoji: string;
  weapon: string;
  damageMult: number;
  resource: "hp" | "mp";
  // Lv1 ベースステ
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  // 成長 (per level)
  growthHp: number;
  growthAttack: number;
  growthDefense: number;
  growthSpeed: number;
  // 魔法使いのみ MP
  baseMp?: number;
  growthMp?: number;
}

export const jobsMaster: Record<JobId, JobMaster> = {
  warrior: {
    id: "warrior",
    displayName: "ヨウ",
    emoji: "🛡️",
    weapon: "剣",
    damageMult: 1.2,
    resource: "hp",
    baseHp: 110,
    baseAttack: 20,
    baseDefense: 8,
    baseSpeed: 10,
    growthHp: 10,
    growthAttack: 3,
    growthDefense: 1,
    growthSpeed: 1
  },
  monk: {
    id: "monk",
    displayName: "ダイチ",
    emoji: "👊",
    weapon: "素手",
    damageMult: 0.8,
    resource: "hp",
    baseHp: 130,
    baseAttack: 13,
    baseDefense: 14,
    baseSpeed: 9,
    growthHp: 12,
    growthAttack: 2,
    growthDefense: 2,
    growthSpeed: 1
  },
  mage: {
    id: "mage",
    displayName: "ナユ",
    emoji: "🔮",
    weapon: "杖",
    damageMult: 1.3,
    resource: "mp",
    baseHp: 70,
    baseAttack: 10,
    baseDefense: 5,
    baseSpeed: 11,
    growthHp: 5,
    growthAttack: 2,
    growthDefense: 0,
    growthSpeed: 1,
    baseMp: 30,
    growthMp: 3
  },
  youtuber: {
    id: "youtuber",
    displayName: YOUTUBER_DISPLAY_NAME,
    emoji: "🎤",
    weapon: "マイク",
    damageMult: 1.3,
    resource: "hp",
    baseHp: 80,
    baseAttack: 8,
    baseDefense: 6,
    baseSpeed: 14,
    growthHp: 6,
    growthAttack: 1,
    growthDefense: 1,
    growthSpeed: 2
  }
};

// 主人公マスター
export const heroMaster = {
  id: "hero" as const,
  emoji: "🦸",
  damageMult: 1.0,
  resource: "hp" as const,
  baseHp: 100,
  baseAttack: 15,
  baseDefense: 10,
  baseSpeed: 12,
  growthHp: 8,
  growthAttack: 2,
  growthDefense: 1,
  growthSpeed: 1
};

export const computeStats = (
  base: { hp: number; attack: number; defense: number; speed: number; mp?: number },
  growth: { hp: number; attack: number; defense: number; speed: number; mp?: number },
  level: number
) => {
  const lvBonus = Math.max(0, level - 1);
  return {
    maxHp: base.hp + growth.hp * lvBonus,
    attack: base.attack + growth.attack * lvBonus,
    defense: base.defense + growth.defense * lvBonus,
    speed: base.speed + growth.speed * lvBonus,
    maxMp:
      typeof base.mp === "number" && typeof growth.mp === "number"
        ? base.mp + growth.mp * lvBonus
        : undefined
  };
};

export const jobStats = (job: JobId, level: number) => {
  const m = jobsMaster[job];
  return computeStats(
    {
      hp: m.baseHp,
      attack: m.baseAttack,
      defense: m.baseDefense,
      speed: m.baseSpeed,
      mp: m.baseMp
    },
    {
      hp: m.growthHp,
      attack: m.growthAttack,
      defense: m.growthDefense,
      speed: m.growthSpeed,
      mp: m.growthMp
    },
    level
  );
};

export const heroStats = (level: number) =>
  computeStats(
    {
      hp: heroMaster.baseHp,
      attack: heroMaster.baseAttack,
      defense: heroMaster.baseDefense,
      speed: heroMaster.baseSpeed
    },
    {
      hp: heroMaster.growthHp,
      attack: heroMaster.growthAttack,
      defense: heroMaster.growthDefense,
      speed: heroMaster.growthSpeed
    },
    level
  );

export const memberDisplayName = (
  id: PartyMemberId,
  heroName: string
): string => {
  if (id === "hero") return heroName || "しゅじんこう";
  return jobsMaster[id].displayName;
};

export const memberEmoji = (id: PartyMemberId): string => {
  if (id === "hero") return heroMaster.emoji;
  return jobsMaster[id].emoji;
};

export const memberDamageMult = (id: PartyMemberId): number => {
  if (id === "hero") return heroMaster.damageMult;
  return jobsMaster[id].damageMult;
};
