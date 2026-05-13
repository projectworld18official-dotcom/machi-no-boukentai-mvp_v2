import { useState } from 'react';
import type { GameState, PartyMember } from '../types/game';

const initialParty: PartyMember[] = [
  { id: 'you', name: 'ヨウ', job: '戦士', level: 1, hp: 45, maxHp: 45, mp: 0, maxMp: 0, joined: false },
];

const initialState: GameState = {
  screen: 'title',
  player: null,
  party: initialParty,
  currentIsland: 1,
  currentLocation: 'village',
};

export const useGameState = () => {
  const [state, setState] = useState<GameState>(initialState);

  const startNewGame = (name: string, gender: 'male' | 'female') => {
    setState(prev => ({
      ...prev,
      screen: 'field',
      player: {
        name, gender,
        level: 1,
        hp: 35, maxHp: 35,
        mp: 12, maxMp: 12,
        atk: 10, def: 8,
        exp: 0, gold: 0,
      },
      party: prev.party.map(m => m.id === 'you' ? { ...m, joined: true } : m),
    }));
  };

  const goToScreen = (screen: GameState['screen']) =>
    setState(prev => ({ ...prev, screen }));

  const addRewards = (exp: number, gold: number) => {
    setState(prev => {
      if (!prev.player) return prev;
      const newExp = prev.player.exp + exp;
      const newGold = prev.player.gold + gold;
      const threshold = prev.player.level * 20;
      const levelUp = newExp >= threshold;
      return {
        ...prev,
        player: {
          ...prev.player,
          exp: levelUp ? newExp - threshold : newExp,
          gold: newGold,
          level: levelUp ? prev.player.level + 1 : prev.player.level,
          maxHp: levelUp ? prev.player.maxHp + 5 : prev.player.maxHp,
          hp: levelUp ? prev.player.maxHp + 5 : prev.player.hp,
          atk: levelUp ? prev.player.atk + 2 : prev.player.atk,
          def: levelUp ? prev.player.def + 1 : prev.player.def,
        },
      };
    });
  };

  return { state, startNewGame, goToScreen, addRewards };
};
