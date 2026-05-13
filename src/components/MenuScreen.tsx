import type { GameState } from '../types/game';

interface Props {
  state: GameState;
  onClose: () => void;
  onSave: () => void;
}

export const MenuScreen = ({ state, onClose, onSave }: Props) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:'16px', color:'#e8e8e8', zIndex:100 }}>
    <div style={{ fontSize:'1.2rem', fontWeight:'bold', marginBottom:'8px' }}>メニュー</div>

    {state.player && (
      <div style={{ background:'#1a1a2e', padding:'16px', borderRadius:'8px', minWidth:'240px', fontSize:'0.9rem', lineHeight:2 }}>
        <div>名前: {state.player.name}</div>
        <div>Lv: {state.player.level}　HP: {state.player.hp}/{state.player.maxHp}</div>
        <div>MP: {state.player.mp}/{state.player.maxMp}</div>
        <div>ATK: {state.player.atk}　DEF: {state.player.def}</div>
        <div>EXP: {state.player.exp}　G: {state.player.gold}</div>
        <div style={{ marginTop:'8px', color:'#aaa', fontSize:'0.8rem' }}>
          地図のかけら: {state.clearedIslands?.length ?? 0} / 18
        </div>
      </div>
    )}

    <button
      onClick={onSave}
      style={{ padding:'12px 32px', background:'#2a2a4a', color:'#e8e8e8', border:'1px solid #555', borderRadius:'8px', fontSize:'1rem', cursor:'pointer', fontFamily:'inherit' }}
    >
      セーブ
    </button>
    <button
      onClick={onClose}
      style={{ padding:'12px 32px', background:'#333', color:'#aaa', border:'1px solid #444', borderRadius:'8px', fontSize:'1rem', cursor:'pointer', fontFamily:'inherit' }}
    >
      とじる
    </button>
  </div>
);
