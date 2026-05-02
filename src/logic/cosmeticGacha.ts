import type { Rarity } from "../types";
import { skins, skinsByRarity } from "../data/skins";

export const GACHA_COST_SINGLE = 30;
export const GACHA_COST_TEN = 300;

export const RARITY_RATES: Record<Rarity, number> = {
  3: 70,
  4: 24,
  5: 6
};

export const DUPLICATE_REFUND: Record<Rarity, number> = {
  3: 10,
  4: 30,
  5: 80
};

const pickRarity = (): Rarity => {
  const r = Math.random() * 100;
  if (r < RARITY_RATES[5]) return 5;
  if (r < RARITY_RATES[5] + RARITY_RATES[4]) return 4;
  return 3;
};

const pickSkinByRarity = (rarity: Rarity): string => {
  const pool = skinsByRarity(rarity);
  if (pool.length === 0) {
    // フォールバック: 全 skins からランダム
    return skins[Math.floor(Math.random() * skins.length)].id;
  }
  return pool[Math.floor(Math.random() * pool.length)].id;
};

export const rollSingleSkin = (): string => {
  const rarity = pickRarity();
  return pickSkinByRarity(rarity);
};

// 10連: 最後の1体は最低 ★4 保証
export const rollTenSkins = (): string[] => {
  const result: string[] = [];
  for (let i = 0; i < 9; i++) {
    result.push(rollSingleSkin());
  }
  // 最後の1体: ★4 (80%) or ★5 (20%) 抽選
  const lastRarity: Rarity = Math.random() < 0.2 ? 5 : 4;
  result.push(pickSkinByRarity(lastRarity));
  return result;
};

export interface GachaPullResult {
  skinId: string;
  rarity: Rarity;
  duplicate: boolean;
  refundGems: number;
}

export const evaluatePulls = (
  pulledIds: string[],
  ownedSkins: Record<string, true>
): GachaPullResult[] => {
  const seen = new Set<string>(Object.keys(ownedSkins));
  return pulledIds.map((id) => {
    const skin = skins.find((s) => s.id === id)!;
    const duplicate = seen.has(id);
    if (!duplicate) seen.add(id);
    return {
      skinId: id,
      rarity: skin.rarity,
      duplicate,
      refundGems: duplicate ? DUPLICATE_REFUND[skin.rarity] : 0
    };
  });
};
