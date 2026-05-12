export interface NPC { id: string; name: string; dialogue: string[]; }
export const asaIslandVillageNPCs: NPC[] = [
  { id: 'elder', name: 'おじいさん', dialogue: ['ここはあさ島の村じゃ。', '街へ行くがよい。ダンジョンに謎がある…'] },
  { id: 'you-npc', name: 'ヨウ', dialogue: ['オレもここに迷い込んできたんだ。', '一緒に行こうぜ！'] },
];
