export const GACHA_COST_SINGLE = 30;
export const GACHA_COST_TEN = 300;

const table = [
  { id: "hina", weight: 3 },
  { id: "daichi", weight: 3 },
  { id: "sora", weight: 12 },
  { id: "yuu", weight: 12 },
  { id: "mio", weight: 70 }
];

const highTable = [
  { id: "hina", weight: 10 },
  { id: "daichi", weight: 10 },
  { id: "sora", weight: 40 },
  { id: "yuu", weight: 40 }
];

const pick = (list: { id: string; weight: number }[]): string => {
  const total = list.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;

  for (const item of list) {
    r -= item.weight;
    if (r <= 0) return item.id;
  }

  return list[0].id;
};

export const rollSingle = (): string => pick(table);

export const rollTen = (): string[] => {
  const result: string[] = [];

  for (let i = 0; i < 9; i++) result.push(rollSingle());

  result.push(pick(highTable));
  return result;
};

export const rarityText = (): string =>
  `★5=6% / ★4=24% / ★3=70% 10連は最後の1体が最低★4`;
