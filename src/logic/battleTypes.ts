import type { PartyMemberId } from "../types";
import type { Skill } from "../data/skills";

export interface ActorState {
  id: string;                  // 一意 ID (味方は PartyMemberId、敵は "enemy_0" 等)
  side: "ally" | "enemy";
  memberId?: PartyMemberId;    // 味方のみ
  displayName: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  attack: number;
  defense: number;
  speed: number;
  // バフ・状態
  defenseBuffPct?: number;     // このターン被ダメ軽減 (0-1)
  attackBuff?: { mult: number; turnsRemaining: number };
  counter?: boolean;           // 次に被弾したら反射
  paralyzed?: boolean;         // 麻痺で次行動不可
}

export type ActionType = "attack" | "skill" | "defend";

export interface QueuedAction {
  actor: ActorState;
  type: ActionType;
  skill?: Skill;
  targets: ActorState[];       // 単体は [target], 全体は配列
}

export interface BattleLogLine {
  id: number;
  text: string;
  kind: "info" | "damage" | "heal" | "skill" | "victory" | "defeat" | "passive";
}
