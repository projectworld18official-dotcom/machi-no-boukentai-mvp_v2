import type { PartyMemberId, Rarity, SkinSlot } from "../types";

export interface Skin {
  id: string;
  charId: PartyMemberId;
  slot: SkinSlot;
  rarity: Rarity;
  name: string;
  description: string;
  bodyColor?: string;
  borderColor?: string;
  effectColor?: string;
  imageUrl: string | null; // Phase 2e で差し替え予定
}

const COLORS = {
  red: "#E74C3C",
  blue: "#3498DB",
  green: "#27AE60",
  gold: "#F1C40F",
  rainbow: "linear-gradient(135deg, #ff5577, #ffaa00, #88ff66, #66ccff, #cc66ff)"
};

// 各キャラ「ノーマル」色 (デフォルト服)
const NORMAL_COLORS: Record<PartyMemberId, string> = {
  hero: "#5b8def",
  warrior: "#7d8fb3",
  monk: "#fafafa",
  mage: "#b76dff",
  youtuber: "#cf3a3a"
};

const NORMAL_LABELS: Record<PartyMemberId, string> = {
  hero: "ノーマル",
  warrior: "ノーマル",
  monk: "白道着",
  mage: "ノーマル",
  youtuber: "ノーマル"
};

const r3Set: Array<{ key: string; name: string; color: string }> = [
  { key: "red", name: "レッド", color: COLORS.red },
  { key: "blue", name: "ブルー", color: COLORS.blue },
  { key: "green", name: "グリーン", color: COLORS.green }
];

// モンク特殊命名 (赤道着/青道着/黒道着)
const r3SetMonk: Array<{ key: string; name: string; color: string }> = [
  { key: "black", name: "黒道着", color: "#222222" },
  { key: "red", name: "赤道着", color: COLORS.red },
  { key: "blue", name: "青道着", color: COLORS.blue }
];

const buildSkinsFor = (charId: PartyMemberId, opts: {
  goldName: string;
  rare2Name: string;
  rare2Color: string;
  special1: { id: string; name: string; effectColor: string; description: string };
  special2: { id: string; name: string; effectColor: string; description: string };
}): Skin[] => {
  const isMonk = charId === "monk";
  const r3Colors = isMonk ? r3SetMonk : r3Set;

  const list: Skin[] = [
    {
      id: `${charId}_body_normal`,
      charId,
      slot: "body",
      rarity: 3,
      name: NORMAL_LABELS[charId],
      description: "はじめからもっているふく",
      bodyColor: NORMAL_COLORS[charId],
      imageUrl: null
    },
    ...r3Colors.map<Skin>(({ key, name, color }) => ({
      id: `${charId}_body_${key}`,
      charId,
      slot: "body",
      rarity: 3,
      name,
      description: `${name}カラーのふく`,
      bodyColor: color,
      imageUrl: null
    })),
    {
      id: `${charId}_body_gold`,
      charId,
      slot: "body",
      rarity: 4,
      name: opts.goldName,
      description: "きらきらゴールドのレアふく",
      bodyColor: COLORS.gold,
      borderColor: "#ffd700",
      imageUrl: null
    },
    {
      id: `${charId}_body_rare2`,
      charId,
      slot: "body",
      rarity: 4,
      name: opts.rare2Name,
      description: `とくべつな${opts.rare2Name}のふく`,
      bodyColor: opts.rare2Color,
      borderColor: "#ff77ff",
      imageUrl: null
    },
    {
      id: opts.special1.id,
      charId,
      slot: "special",
      rarity: 5,
      name: opts.special1.name,
      description: opts.special1.description,
      effectColor: opts.special1.effectColor,
      imageUrl: null
    },
    {
      id: opts.special2.id,
      charId,
      slot: "special",
      rarity: 5,
      name: opts.special2.name,
      description: opts.special2.description,
      effectColor: opts.special2.effectColor,
      imageUrl: null
    }
  ];
  return list;
};

export const skins: Skin[] = [
  ...buildSkinsFor("hero", {
    goldName: "ゴールド",
    rare2Name: "レインボー",
    rare2Color: COLORS.rainbow,
    special1: { id: "hero_special_blueflame", name: "ヴォルガ・蒼炎", effectColor: "#3aa1ff", description: "ヴォルガが青いほのおになる" },
    special2: { id: "hero_special_redflame", name: "ヴォルガ・紅蓮", effectColor: "#ff3a3a", description: "ヴォルガが真っ赤になる" }
  }),
  ...buildSkinsFor("warrior", {
    goldName: "ゴールド",
    rare2Name: "銀月",
    rare2Color: "#c0c0c0",
    special1: { id: "warrior_special_ice", name: "斬撃・氷", effectColor: "#7ed4ff", description: "斬撃が氷の刃になる" },
    special2: { id: "warrior_special_thunder", name: "斬撃・雷", effectColor: "#ffd400", description: "斬撃が雷の刃になる" }
  }),
  ...buildSkinsFor("monk", {
    goldName: "金道着",
    rare2Name: "虹道着",
    rare2Color: COLORS.rainbow,
    special1: { id: "monk_special_flash", name: "正拳・閃光", effectColor: "#ffffaa", description: "正拳が閃光をはなつ" },
    special2: { id: "monk_special_afterimage", name: "正拳・残像", effectColor: "#aaaaff", description: "正拳に残像がうつる" }
  }),
  ...buildSkinsFor("mage", {
    goldName: "ゴールド",
    rare2Name: "レインボー",
    rare2Color: COLORS.rainbow,
    special1: { id: "mage_special_blueflame", name: "ファイア・蒼炎", effectColor: "#3aa1ff", description: "ファイアが青いほのおになる" },
    special2: { id: "mage_special_purpleflame", name: "ファイア・紫炎", effectColor: "#bb44ff", description: "ファイアが紫のほのおになる" }
  }),
  ...buildSkinsFor("youtuber", {
    goldName: "ゴールド",
    rare2Name: "虹サングラス",
    rare2Color: COLORS.rainbow,
    special1: { id: "youtuber_special_thunder", name: "収録・電撃", effectColor: "#ffd400", description: "しゅうろくが電撃をまとう" },
    special2: { id: "youtuber_special_redlight", name: "収録・赤光", effectColor: "#ff3a3a", description: "しゅうろくが赤い光をはなつ" }
  })
];

export const skinsById = (): Record<string, Skin> => {
  const map: Record<string, Skin> = {};
  skins.forEach((s) => {
    map[s.id] = s;
  });
  return map;
};

export const skinsByChar = (charId: PartyMemberId): Skin[] =>
  skins.filter((s) => s.charId === charId);

export const skinsByCharSlot = (charId: PartyMemberId, slot: SkinSlot): Skin[] =>
  skins.filter((s) => s.charId === charId && s.slot === slot);

export const getSkin = (id: string | null): Skin | null => {
  if (!id) return null;
  return skins.find((s) => s.id === id) ?? null;
};

export const skinsByRarity = (rarity: Rarity): Skin[] =>
  skins.filter((s) => s.rarity === rarity);
