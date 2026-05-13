export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  isBoss?: boolean;
}

export const asaIslandMonsters: Monster[] = [
  { id: 'koke_goblin', name: 'コケゴブリン', hp: 8,  maxHp: 8,  atk: 3, def: 1, exp: 5,  gold: 3 },
  { id: 'hako_game',   name: 'ハコガメ',     hp: 12, maxHp: 12, atk: 2, def: 5, exp: 8,  gold: 5 },
  { id: 'yabu_slime',  name: 'ヤブスライム', hp: 6,  maxHp: 6,  atk: 4, def: 0, exp: 4,  gold: 2 },
];

export const asaIslandBoss: Monster = {
  id: 'hill_guardian', name: '丘の番人',
  hp: 60, maxHp: 60, atk: 8, def: 6, exp: 80, gold: 50, isBoss: true,
};

export const getRandomMonster = (): Monster => {
  const m = asaIslandMonsters[Math.floor(Math.random() * asaIslandMonsters.length)];
  return { ...m };
};
