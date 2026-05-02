import type { JobId, PartyMemberId } from "../types";

export type SkillTarget = "enemySingle" | "enemyAll" | "allySingle" | "allyAll" | "self";
export type SkillCostType = "hpPercent" | "mp";

export interface SkillEffect {
  // 攻撃
  hits?: number;            // 連続攻撃回数 (default 1)
  multiplier?: number;      // 攻撃力倍率 (1.7 等)
  paralyzeChance?: number;  // 麻痺確率 (0-1)
  selfRecoilPercent?: number; // 自身反動 (maxHp の割合)
  // 確率発動 (ユーチューバー)
  procChance?: number;      // 0-1
  enemyHpRatio?: number;    // 敵現HPの割合 (0-1) を固定ダメージに
  // 回復
  healPercent?: number;     // ターゲット maxHp の割合 (回復)
  healAllyAll?: boolean;
  // 蘇生
  reviveHpPercent?: number;
  // バフ
  selfDefenseUp?: number;   // 0-1, このターン被ダメ軽減
  selfAttackBuff?: { mult: number; turns: number };
  counter?: boolean;        // 次ターン反射
  // 属性
  element?: "fire" | "ice" | "phys";
}

export interface Skill {
  id: string;
  owner: PartyMemberId;
  name: string;
  unlockLevel: number;
  costType: SkillCostType;
  costValue: number;        // hpPercent: 0-100 (%), mp: 整数
  target: SkillTarget;
  effect: SkillEffect;
  description: string;
}

export const heroSkills: Skill[] = [
  {
    id: "hero_volga",
    owner: "hero",
    name: "ヴォルガ",
    unlockLevel: 5,
    costType: "hpPercent",
    costValue: 5,
    target: "enemySingle",
    effect: { multiplier: 1.7, paralyzeChance: 0.05 },
    description: "単体1.7倍 麻痺5%"
  },
  {
    id: "hero_xicro",
    owner: "hero",
    name: "ザイクロ",
    unlockLevel: 15,
    costType: "hpPercent",
    costValue: 8,
    target: "enemySingle",
    effect: { hits: 2, multiplier: 1.1, paralyzeChance: 0.1 },
    description: "2回攻撃 1.1倍×2 麻痺10%"
  },
  {
    id: "hero_vernis",
    owner: "hero",
    name: "ヴェルニス",
    unlockLevel: 25,
    costType: "hpPercent",
    costValue: 12,
    target: "enemyAll",
    effect: { multiplier: 0.85, paralyzeChance: 0.15 },
    description: "全体0.85倍 麻痺15%"
  },
  {
    id: "hero_overga",
    owner: "hero",
    name: "オーヴァガ",
    unlockLevel: 35,
    costType: "hpPercent",
    costValue: 18,
    target: "enemySingle",
    effect: { multiplier: 3.8, selfRecoilPercent: 3 },
    description: "単体3.8倍 自身反動3%"
  },
  {
    id: "hero_plazro",
    owner: "hero",
    name: "プラズロ",
    unlockLevel: 45,
    costType: "hpPercent",
    costValue: 25,
    target: "enemySingle",
    effect: { hits: 5, multiplier: 0.7 },
    description: "5回攻撃 0.7倍×5"
  }
];

export const warriorSkills: Skill[] = [
  { id: "warrior_zangeki", owner: "warrior", name: "斬撃", unlockLevel: 5, costType: "hpPercent", costValue: 5, target: "enemySingle", effect: { multiplier: 1.8 }, description: "単体1.8倍" },
  { id: "warrior_nidan", owner: "warrior", name: "二段斬り", unlockLevel: 15, costType: "hpPercent", costValue: 8, target: "enemySingle", effect: { hits: 2, multiplier: 1.2 }, description: "2回攻撃 1.2倍×2" },
  { id: "warrior_shippu", owner: "warrior", name: "疾風斬り", unlockLevel: 25, costType: "hpPercent", costValue: 12, target: "enemyAll", effect: { multiplier: 0.9 }, description: "全体0.9倍" },
  { id: "warrior_gouken", owner: "warrior", name: "剛剣", unlockLevel: 35, costType: "hpPercent", costValue: 18, target: "enemySingle", effect: { multiplier: 4.0 }, description: "単体4.0倍" },
  { id: "warrior_renzan", owner: "warrior", name: "連斬", unlockLevel: 45, costType: "hpPercent", costValue: 25, target: "enemySingle", effect: { hits: 5, multiplier: 0.7 }, description: "5回攻撃 0.7倍×5" }
];

export const monkSkills: Skill[] = [
  { id: "monk_seiken", owner: "monk", name: "正拳突き", unlockLevel: 5, costType: "hpPercent", costValue: 5, target: "enemySingle", effect: { multiplier: 1.5 }, description: "単体1.5倍" },
  { id: "monk_kamae", owner: "monk", name: "構え", unlockLevel: 15, costType: "hpPercent", costValue: 8, target: "self", effect: { selfDefenseUp: 0.5, counter: true }, description: "1ターン被ダメ50%カット+反撃" },
  { id: "monk_atemi", owner: "monk", name: "当て身投げ", unlockLevel: 25, costType: "hpPercent", costValue: 12, target: "self", effect: { counter: true }, description: "次ターン反射" },
  { id: "monk_kiai", owner: "monk", name: "気合溜め", unlockLevel: 35, costType: "hpPercent", costValue: 18, target: "self", effect: { selfAttackBuff: { mult: 1.5, turns: 2 } }, description: "攻撃1.5倍×2ターン" },
  { id: "monk_uraken", owner: "monk", name: "裏拳乱舞", unlockLevel: 45, costType: "hpPercent", costValue: 25, target: "enemySingle", effect: { hits: 3, multiplier: 0.9, paralyzeChance: 0.15 }, description: "0.9倍×3 麻痺15%" }
];

export const mageSkills: Skill[] = [
  { id: "mage_fire", owner: "mage", name: "ファイア", unlockLevel: 5, costType: "mp", costValue: 5, target: "enemySingle", effect: { multiplier: 1.6, element: "fire" }, description: "単体1.6倍 火" },
  { id: "mage_heal", owner: "mage", name: "回復", unlockLevel: 15, costType: "mp", costValue: 8, target: "allySingle", effect: { healPercent: 0.3 }, description: "単体30%回復" },
  { id: "mage_blizzard", owner: "mage", name: "ブリザード", unlockLevel: 25, costType: "mp", costValue: 12, target: "enemyAll", effect: { multiplier: 1.0, element: "ice" }, description: "全体1.0倍 氷" },
  { id: "mage_heal_all", owner: "mage", name: "全体回復", unlockLevel: 35, costType: "mp", costValue: 18, target: "allyAll", effect: { healPercent: 0.25, healAllyAll: true }, description: "全体25%回復" },
  { id: "mage_megafire", owner: "mage", name: "メガファイア", unlockLevel: 45, costType: "mp", costValue: 25, target: "enemySingle", effect: { multiplier: 3.5, element: "fire" }, description: "単体3.5倍 火" },
  { id: "mage_revive", owner: "mage", name: "蘇生", unlockLevel: 55, costType: "mp", costValue: 35, target: "allySingle", effect: { reviveHpPercent: 0.5 }, description: "戦闘不能味方をHP50%復活" },
  { id: "mage_meteor", owner: "mage", name: "メテオ", unlockLevel: 65, costType: "mp", costValue: 50, target: "enemyAll", effect: { multiplier: 2.5 }, description: "全体2.5倍" }
];

export const youtuberSkills: Skill[] = [
  { id: "yt_recording", owner: "youtuber", name: "収録", unlockLevel: 5, costType: "hpPercent", costValue: 5, target: "enemySingle", effect: { procChance: 0.1, enemyHpRatio: 0.75 }, description: "10%発動 敵HP75%ダメージ" },
  { id: "yt_streaming", owner: "youtuber", name: "配信", unlockLevel: 15, costType: "hpPercent", costValue: 8, target: "enemySingle", effect: { procChance: 0.15, enemyHpRatio: 0.8 }, description: "15%発動 敵HP80%" },
  { id: "yt_subscribe", owner: "youtuber", name: "チャンネル登録", unlockLevel: 25, costType: "hpPercent", costValue: 12, target: "enemyAll", effect: { procChance: 0.2, enemyHpRatio: 0.6 }, description: "20%発動 全体HP60%" },
  { id: "yt_10000", owner: "youtuber", name: "登録者1万人", unlockLevel: 35, costType: "hpPercent", costValue: 18, target: "enemyAll", effect: { procChance: 0.3, enemyHpRatio: 0.7 }, description: "30%発動 全体HP70%" },
  { id: "yt_proof", owner: "youtuber", name: "有名ユーチューバーの証", unlockLevel: 45, costType: "hpPercent", costValue: 25, target: "enemyAll", effect: { procChance: 0.45, enemyHpRatio: 0.8 }, description: "45%発動 全体HP80%" },
  { id: "yt_hero", owner: "youtuber", name: "ユーチューバーは世界を救う", unlockLevel: 55, costType: "hpPercent", costValue: 25, target: "enemyAll", effect: { procChance: 0.6, enemyHpRatio: 0.9 }, description: "60%発動 全体HP90%" }
];

export const allSkills: Skill[] = [
  ...heroSkills,
  ...warriorSkills,
  ...monkSkills,
  ...mageSkills,
  ...youtuberSkills
];

export const skillsByOwner = (owner: PartyMemberId): Skill[] => {
  switch (owner) {
    case "hero":
      return heroSkills;
    case "warrior":
      return warriorSkills;
    case "monk":
      return monkSkills;
    case "mage":
      return mageSkills;
    case "youtuber":
      return youtuberSkills;
  }
};

export const unlockedSkills = (owner: PartyMemberId, level: number): Skill[] =>
  skillsByOwner(owner).filter((s) => s.unlockLevel <= level);

// オーナー型ガード (PartyMemberId かどうか)
export const isPartyMemberId = (
  owner: string
): owner is PartyMemberId =>
  owner === "hero" ||
  (["warrior", "monk", "mage", "youtuber"] as JobId[]).includes(owner as JobId);
