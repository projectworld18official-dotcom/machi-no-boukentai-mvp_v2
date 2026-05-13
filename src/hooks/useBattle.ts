import { useState, useCallback } from 'react';
import type { Monster } from '../data/monsters';
import type { Player } from '../types/game';

export type BattlePhase = 'command' | 'player_action' | 'enemy_action' | 'victory' | 'defeat' | 'escaped';

export interface BattleState {
  phase: BattlePhase;
  enemy: Monster;
  message: string;
  turnCount: number;
}

const calcDamage = (atk: number, def: number): number =>
  Math.max(1, atk - Math.floor(def / 2));

export const useBattle = (player: Player, enemy: Monster) => {
  const [battleState, setBattleState] = useState<BattleState>({
    phase: 'command',
    enemy: { ...enemy },
    message: `${enemy.name}があらわれた！`,
    turnCount: 0,
  });
  const [playerHp, setPlayerHp] = useState(player.hp);

  const executeCommand = useCallback((command: 'attack' | 'magic' | 'item' | 'run') => {
    if (battleState.phase !== 'command') return;

    if (command === 'magic' || command === 'item') {
      setBattleState(prev => ({ ...prev, message: 'まだ つかえない！' }));
      return;
    }

    if (command === 'run') {
      const success = Math.random() < 0.5;
      if (success) {
        setBattleState(prev => ({ ...prev, phase: 'escaped', message: 'うまく にげきれた！' }));
      } else {
        const dmg = calcDamage(battleState.enemy.atk, player.def);
        const newHp = Math.max(0, playerHp - dmg);
        setPlayerHp(newHp);
        if (newHp <= 0) {
          setBattleState(prev => ({ ...prev, phase: 'defeat', message: 'やられてしまった…' }));
        } else {
          setBattleState(prev => ({
            ...prev,
            message: `にげられなかった！\n${prev.enemy.name}の こうげき！\n${dmg}のダメージ！`,
          }));
        }
      }
      return;
    }

    // たたかう
    setBattleState(prev => {
      const currentEnemy = { ...prev.enemy };
      const playerDmg = calcDamage(player.atk, currentEnemy.def);
      currentEnemy.hp = Math.max(0, currentEnemy.hp - playerDmg);

      if (currentEnemy.hp <= 0) {
        return {
          ...prev,
          phase: 'victory',
          enemy: currentEnemy,
          message: `${currentEnemy.name}に ${playerDmg}のダメージ！\n${currentEnemy.name}をたおした！`,
        };
      }

      // 敵の反撃
      let enemyDmg = calcDamage(currentEnemy.atk, player.def);

      // ボス特殊技（3ターンごと）
      if (currentEnemy.isBoss && prev.turnCount % 3 === 0 && prev.turnCount > 0) {
        const roll = Math.random();
        if (roll < 0.33) {
          // ふみつけ（1.5倍ダメージ）
          enemyDmg = Math.floor(enemyDmg * 1.5);
          const newHp = Math.max(0, playerHp - enemyDmg);
          setPlayerHp(newHp);
          return {
            ...prev,
            enemy: currentEnemy,
            turnCount: prev.turnCount + 1,
            phase: newHp <= 0 ? 'defeat' : 'command',
            message: `${currentEnemy.name}に ${playerDmg}のダメージ！\n${currentEnemy.name}のふみつけ！\n${enemyDmg}のダメージ！${newHp <= 0 ? '\nやられてしまった…' : ''}`,
          };
        } else if (roll < 0.66) {
          // がんせきなげ（0.8倍）
          enemyDmg = Math.floor(enemyDmg * 0.8);
        }
      }

      const newHp = Math.max(0, playerHp - enemyDmg);
      setPlayerHp(newHp);
      return {
        ...prev,
        enemy: currentEnemy,
        turnCount: prev.turnCount + 1,
        phase: newHp <= 0 ? 'defeat' : 'command',
        message: `${currentEnemy.name}に ${playerDmg}のダメージ！\n${currentEnemy.name}のこうげき！\n${enemyDmg}のダメージ！${newHp <= 0 ? '\nやられてしまった…' : ''}`,
      };
    });
  }, [battleState, player, playerHp]);

  return { battleState, playerHp, executeCommand };
};
