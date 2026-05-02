import type { Character } from "../types";

// 5体目候補:
// 1. ライガ (雷のしし)
// 2. モモカ (花のまほう)
// 3. ダイチ (土のまもり) ← 採用

export const characters: Character[] = [
  {
    id: "hina",
    name: "ヒナ",
    hp: 120,
    attack: 18,
    skillName: "ひなサンライズ",
    skillPower: 42,
    rarity: 5,
    color: "#ff8fb1",
    emoji: "🌸"
  },
  {
    id: "sora",
    name: "ソラ",
    hp: 100,
    attack: 20,
    skillName: "スカイストーム",
    skillPower: 38,
    rarity: 4,
    color: "#63b3ff",
    emoji: "☁️"
  },
  {
    id: "mio",
    name: "ミオ",
    hp: 110,
    attack: 16,
    skillName: "みずしぶき",
    skillPower: 34,
    rarity: 3,
    color: "#4fd4c6",
    emoji: "💧"
  },
  {
    id: "yuu",
    name: "ユウ",
    hp: 130,
    attack: 15,
    skillName: "ゆうきパンチ",
    skillPower: 36,
    rarity: 4,
    color: "#ffc94d",
    emoji: "⭐"
  },
  {
    id: "daichi",
    name: "ダイチ",
    hp: 150,
    attack: 14,
    skillName: "グランドクラッシュ",
    skillPower: 45,
    rarity: 5,
    color: "#8f6d45",
    emoji: "🪨"
  }
];

export const getCharacter = (id: string): Character =>
  characters.find((c) => c.id === id) ?? characters[0];
