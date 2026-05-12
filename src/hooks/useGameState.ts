import { useState } from 'react';
import type { GameState, PartyMember } from '../types/game';
const initialParty: PartyMember[] = [{ id: 'you', name: 'ヨウ', job: '戦士', level: 1, hp: 40, maxHp: 40, mp: 0, maxMp: 0, joined: false }];
const initialState: GameState = { screen: 'title', player: null, party: initialParty, currentIsland: 1, currentLocation: 'village' };
export const useGameState = () => {
  const [state, setState] = useState<GameState>(initialState);
  const startNewGame = (name: string, gender: 'male' | 'female') => {
    setState(prev => ({ ...prev, screen: 'field', player: { name, gender, level: 1, hp: 35, maxHp: 35, mp: 12, maxMp: 12 }, party: prev.party.map(m => m.id === 'you' ? { ...m, joined: true } : m) }));
  };
  const goToScreen = (screen: GameState['screen']) => setState(prev => ({ ...prev, screen }));
  return { state, startNewGame, goToScreen };
};
