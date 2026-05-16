export type TileType = 0 | 1 | 2 | 3;
// 0=草(歩行可) | 1=道(歩行可) | 2=壁(不可) | 3=水(不可)

export interface MapEnemyDef {
  name: string;
  symbol: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export const MAP_ENEMY_DEFS: Record<string, MapEnemyDef> = {
  "goroutuki":      { name: "みなとのゴロツキ",    symbol: "👹", level: 3, hp: 80,  attack: 14, defense: 5,  speed: 8  },
  "mayoidako":      { name: "まよいダコ",          symbol: "🐙", level: 4, hp: 90,  attack: 12, defense: 6,  speed: 7  },
  "kowreta-robo":   { name: "こわれたロボ",         symbol: "⚙️", level: 5, hp: 100, attack: 16, defense: 8,  speed: 6  },
  "youkan-obake":   { name: "洋館のおばけ",         symbol: "👻", level: 6, hp: 95,  attack: 15, defense: 5,  speed: 10 },
  "rose-witch":     { name: "ローズウィッチ",       symbol: "🌹", level: 7, hp: 85,  attack: 18, defense: 4,  speed: 12 },
  "harinemusi":     { name: "まよいハリネズミ",     symbol: "🦔", level: 5, hp: 110, attack: 13, defense: 10, speed: 7  },
  "koryuu":         { name: "こりゅう",             symbol: "🐉", level: 8, hp: 120, attack: 20, defense: 8,  speed: 9  },
  "chouchin-obake": { name: "ちょうちんおばけ",     symbol: "🏮", level: 6, hp: 88,  attack: 16, defense: 6,  speed: 9  },
  "kuidae-monster": { name: "くいだおれモンスター", symbol: "🥟", level: 7, hp: 105, attack: 17, defense: 7,  speed: 8  },
};

export interface MapEnemySpawn {
  id: string;
  row: number;
  col: number;
  enemyType: string;
  symbol: string;
  name: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  tiles: TileType[][];
  enemies: MapEnemySpawn[];
  playerStart: { row: number; col: number };
}

export const MAPS: MapDefinition[] = [
  {
    id: "minato-mirai",
    name: "みなとみらいエリア",
    description: "うみのそばのにぎやかなまち",
    tiles: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 1, 1, 1, 0, 0, 0, 2],
      [2, 0, 2, 2, 1, 2, 2, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2],
      [2, 0, 0, 3, 1, 3, 0, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2],
      [2, 0, 0, 1, 1, 1, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
    enemies: [
      { id: "mm-1", row: 2, col: 7, enemyType: "goroutuki",   symbol: "👹", name: "みなとのゴロツキ" },
      { id: "mm-2", row: 4, col: 7, enemyType: "mayoidako",   symbol: "🐙", name: "まよいダコ" },
      { id: "mm-3", row: 7, col: 8, enemyType: "kowreta-robo",symbol: "⚙️", name: "こわれたロボ" },
    ],
    playerStart: { row: 1, col: 1 },
  },
  {
    id: "yamate",
    name: "山手エリア",
    description: "こうかなやしきがならぶしずかなまち",
    tiles: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 2, 0, 1, 0, 2, 0, 0, 2],
      [2, 0, 2, 0, 1, 0, 2, 0, 0, 2],
      [2, 0, 2, 1, 1, 1, 2, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
    enemies: [
      { id: "ym-1", row: 2, col: 7, enemyType: "youkan-obake",symbol: "👻", name: "洋館のおばけ" },
      { id: "ym-2", row: 1, col: 8, enemyType: "rose-witch",  symbol: "🌹", name: "ローズウィッチ" },
      { id: "ym-3", row: 7, col: 7, enemyType: "harinemusi",  symbol: "🦔", name: "まよいハリネズミ" },
    ],
    playerStart: { row: 1, col: 1 },
  },
  {
    id: "chukagai",
    name: "中華街エリア",
    description: "おいしいにおいのするにぎやかなまち",
    tiles: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 1, 1, 0, 0, 0, 2],
      [2, 0, 2, 0, 1, 0, 2, 0, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 0, 2],
      [2, 0, 0, 0, 1, 0, 0, 0, 0, 2],
      [2, 0, 2, 0, 1, 0, 2, 0, 0, 2],
      [2, 0, 0, 0, 1, 1, 0, 0, 0, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
    enemies: [
      { id: "cg-1", row: 2, col: 7, enemyType: "koryuu",         symbol: "🐉", name: "こりゅう" },
      { id: "cg-2", row: 6, col: 7, enemyType: "chouchin-obake", symbol: "🏮", name: "ちょうちんおばけ" },
      { id: "cg-3", row: 4, col: 8, enemyType: "kuidae-monster", symbol: "🥟", name: "くいだおれモンスター" },
    ],
    playerStart: { row: 1, col: 1 },
  },
];
