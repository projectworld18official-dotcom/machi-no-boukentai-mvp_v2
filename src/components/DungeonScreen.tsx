import { useState, useEffect } from 'react';
import type { GameState } from '../types/game';
import { playBGM, stopBGM } from '../utils/audio';
import { MenuScreen } from './MenuScreen';

interface Props {
  state: GameState;
  goToScreen: (screen: GameState['screen']) => void;
  onEnterBattle: (isBoss: boolean) => void;
  onExitDungeon: () => void;
  saveGame: () => void;
}

export const DungeonScreen = ({ state, onEnterBattle, onExitDungeon, saveGame }: Props) => {
  const [floor, setFloor] = useState(1);
  const [message, setMessage] = useState('ダンジョンに入った。足元から冷気が漂う…');
  const [encounterCount, setEncounterCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    playBGM('dungeon');
    return () => stopBGM();
  }, []);

  const handleAdvance = () => {
    if (Math.random() < 0.4) {
      setMessage('まものがあらわれた！');
      setEncounterCount(c => c + 1);
      setTimeout(() => onEnterBattle(false), 800);
      return;
    }

    if (floor < 3) {
      setFloor(f => f + 1);
      setMessage(floor === 2 ? '3階に到達した。ボスの気配がする…' : `${floor + 1}階に進んだ。`);
    } else {
      setMessage('丘の番人が立ちはだかった！');
      setTimeout(() => onEnterBattle(true), 1000);
    }
  };

  const handleRetreat = () => {
    if (floor === 1) {
      onExitDungeon();
    } else {
      setFloor(f => f - 1);
      setMessage(`${floor - 1}階に戻った。`);
    }
  };

  const floorLabel = floor === 3 ? '3階（ボスフロア）' : `${floor}階`;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#0a0a15', color:'#e8e8e8', padding:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <div>
          <div style={{ fontSize:'0.85rem', color:'#888' }}>
            あさ島ダンジョン{encounterCount > 0 ? ` | 戦闘 ${encounterCount}回` : ''}
          </div>
          <div style={{ fontSize:'1.3rem', fontWeight:'bold' }}>{floorLabel}</div>
        </div>
        <button
          onClick={() => setShowMenu(true)}
          style={{ padding:'6px 14px', background:'transparent', border:'1px solid #555', color:'#aaa', borderRadius:4, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}
        >
          メニュー
        </button>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem' }}>
        {floor === 3 ? '🗿' : '🌑'}
      </div>

      <div style={{
        background:'#1a1a2e', border:'1px solid #333', borderRadius:'8px',
        padding:'12px', marginBottom:'16px', minHeight:'60px',
        fontSize:'0.95rem', lineHeight:1.6,
      }}>
        {message}
      </div>

      {state.player && (
        <div style={{ fontSize:'0.8rem', color:'#aaa', marginBottom:'12px', textAlign:'right' }}>
          HP {state.player.hp}/{state.player.maxHp} | Lv {state.player.level}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
        <button
          onClick={handleAdvance}
          style={{ padding:'16px', background:'#2a2a4a', color:'#e8e8e8', border:'1px solid #555', borderRadius:'8px', fontSize:'1rem', fontWeight:'bold', cursor:'pointer', fontFamily:'inherit' }}
        >
          {floor < 3 ? '先に進む' : 'ボスに挑む'}
        </button>
        <button
          onClick={handleRetreat}
          style={{ padding:'16px', background:'#1a1a1a', color:'#aaa', border:'1px solid #333', borderRadius:'8px', fontSize:'1rem', cursor:'pointer', fontFamily:'inherit' }}
        >
          {floor === 1 ? 'ダンジョンを出る' : '戻る'}
        </button>
      </div>

      {showMenu && (
        <MenuScreen
          state={state}
          onClose={() => setShowMenu(false)}
          onSave={() => { saveGame(); setShowMenu(false); }}
        />
      )}
    </div>
  );
};
