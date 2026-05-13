import { useEffect, useState } from 'react';
import type { GameState, Player } from '../types/game';
import { useBattle } from '../hooks/useBattle';
import type { Monster } from '../data/monsters';
import { getRandomMonster, asaIslandBoss } from '../data/monsters';
import { playBGM, stopBGM, playSE } from '../utils/audio';

interface Props {
  state: GameState;
  isBoss?: boolean;
  goToScreen: (screen: GameState['screen']) => void;
  onVictory?: (exp: number, gold: number) => void;
  onDefeat?: () => void;
}

const DUMMY_PLAYER: Player = {
  name: '?', gender: 'male', level: 1,
  hp: 1, maxHp: 1, mp: 0, maxMp: 0,
  atk: 1, def: 0, exp: 0, gold: 0,
};

export const BattleScreen = ({ state, isBoss = false, goToScreen, onVictory, onDefeat }: Props) => {
  const [enemy] = useState<Monster>(() => isBoss ? { ...asaIslandBoss } : getRandomMonster());
  const { battleState, playerHp, executeCommand } = useBattle(state.player ?? DUMMY_PLAYER, enemy);

  useEffect(() => {
    playBGM(isBoss ? 'boss' : 'battle');
    return () => stopBGM();
  }, [isBoss]);

  useEffect(() => {
    if (battleState.phase === 'victory') {
      playSE('victory');
      const t = setTimeout(() => {
        onVictory?.(battleState.enemy.exp, battleState.enemy.gold);
        goToScreen('field');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (battleState.phase === 'defeat') {
      const t = setTimeout(() => {
        onDefeat?.();
        goToScreen('field');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (battleState.phase === 'escaped') {
      const t = setTimeout(() => goToScreen('field'), 1500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState.phase]);

  if (!state.player) return null;

  const isCommandDisabled = battleState.phase !== 'command';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#0d0d1a', color:'#e8e8e8', padding:'16px' }}>
      {/* 敵エリア */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px' }}>
        <div style={{ fontSize:'3rem' }}>{isBoss ? '🗿' : '👾'}</div>
        <div style={{ fontWeight:'bold', fontSize:'1.1rem' }}>{battleState.enemy.name}</div>
        <div style={{ fontSize:'0.9rem', color:'#aaa' }}>
          HP: {battleState.enemy.hp} / {battleState.enemy.maxHp}
        </div>
        <div style={{ width:'160px', height:'8px', background:'#333', borderRadius:'4px' }}>
          <div style={{
            width: `${(battleState.enemy.hp / battleState.enemy.maxHp) * 100}%`,
            height: '100%',
            background: battleState.enemy.hp / battleState.enemy.maxHp > 0.5 ? '#4caf50' : '#f44336',
            borderRadius: '4px',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* プレイヤーHP */}
      <div style={{ textAlign:'right', fontSize:'0.85rem', color:'#ccc', marginBottom:'8px' }}>
        {state.player.name} HP: {playerHp} / {state.player.maxHp}
      </div>

      {/* メッセージウィンドウ */}
      <div style={{
        background:'#1a1a2e', border:'1px solid #444', borderRadius:'8px',
        padding:'12px', minHeight:'80px', marginBottom:'12px',
        fontSize:'0.95rem', whiteSpace:'pre-line', lineHeight:1.6,
      }}>
        {battleState.message}
      </div>

      {/* コマンドボタン */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        {(['attack', 'magic', 'item', 'run'] as const).map((cmd) => {
          const labels = { attack:'たたかう', magic:'まほう', item:'どうぐ', run:'にげる' };
          return (
            <button
              key={cmd}
              onClick={() => executeCommand(cmd)}
              disabled={isCommandDisabled}
              style={{
                padding:'14px', fontSize:'1rem', fontWeight:'bold',
                background: isCommandDisabled ? '#333' : '#2a2a4a',
                color: isCommandDisabled ? '#666' : '#e8e8e8',
                border:'1px solid #555', borderRadius:'8px',
                cursor: isCommandDisabled ? 'default' : 'pointer',
                fontFamily:'inherit',
              }}
            >
              {labels[cmd]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
