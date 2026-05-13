export type Gender = 'male' | 'female';
export type GameScreen = 'title' | 'character-create' | 'field' | 'dungeon' | 'battle';
export interface Player {
  name: string;
  gender: Gender;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
}
export interface PartyMember { id: string; name: string; job: string; level: number; hp: number; maxHp: number; mp: number; maxMp: number; joined: boolean; }
export interface GameState { screen: GameScreen; player: Player | null; party: PartyMember[]; currentIsland: number; currentLocation: 'village' | 'town' | 'dungeon' | 'field'; isBossFlag?: boolean; currentDungeonFloor?: number; }
