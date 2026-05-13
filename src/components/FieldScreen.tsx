import { useEffect, useState } from 'react';
import type { GameState } from '../types/game';
import { asaIslandVillageNPCs } from '../data/npcs';
import type { NPC } from '../data/npcs';
import { playBGM, stopBGM } from '../utils/audio';
import { MenuScreen } from './MenuScreen';

interface Props {
  state: GameState;
  goToScreen: (screen: GameState['screen']) => void;
  saveGame: () => void;
}

export const FieldScreen = ({ state, goToScreen, saveGame }: Props) => {
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [idx, setIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showClearMsg, setShowClearMsg] = useState(
    () => state.clearedIslands?.includes(1) ?? false
  );

  useEffect(() => {
    playBGM('village');
    return () => { stopBGM(); };
  }, []);

  const open = (npc: NPC) => { setActiveNPC(npc); setIdx(0); };
  const advance = () => {
    if (!activeNPC) return;
    if (idx < activeNPC.dialogue.length - 1) setIdx(idx + 1);
    else { setActiveNPC(null); setIdx(0); }
  };
  const party = [
    ...(state.player ? [{ name: state.player.name }] : []),
    ...state.party.filter(m => m.joined).map(m => ({ name: m.name }))
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh', background:'#1a1a2e', padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #333', marginBottom:24 }}>
        <div style={{ color:'#f0d080', fontSize:18 }}>あさ島 — 村</div>
        <button
          onClick={() => setShowMenu(true)}
          style={{ padding:'6px 14px', background:'transparent', border:'1px solid #555', color:'#aaa', borderRadius:4, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}
        >
          メニュー
        </button>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        {asaIslandVillageNPCs.map(npc => (
          <button key={npc.id} onClick={() => open(npc)} style={{ padding:'14px 16px', background:'#16213e', border:'1px solid #333', color:'#e8e8e8', borderRadius:4, cursor:'pointer', textAlign:'left', fontSize:16, fontFamily:'inherit' }}>{npc.name}</button>
        ))}
      </div>

      <div style={{ display:'flex', gap:12, justifyContent:'center', padding:'12px 0', borderTop:'1px solid #333', marginTop:16, flexWrap:'wrap' }}>
        {party.map((m, i) => <span key={i} style={{ color:'#aad4aa', fontSize:14 }}>{m.name}</span>)}
      </div>

      <button
        onClick={() => goToScreen('dungeon')}
        style={{ marginTop:12, padding:12, background:'transparent', border:'1px solid #6080c0', color:'#6080c0', borderRadius:4, cursor:'pointer', fontSize:15, fontFamily:'inherit' }}
      >
        ダンジョンへ
      </button>

      {/* NPC ダイアログ */}
      {activeNPC && (
        <div onClick={advance} style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'#0f0f1e', border:'2px solid #f0d080', borderRadius:'8px 8px 0 0', padding:'20px 24px 24px', cursor:'pointer' }}>
          <div style={{ color:'#f0d080', fontSize:13, marginBottom:8 }}>{activeNPC.name}</div>
          <div style={{ color:'#e8e8e8', fontSize:17, lineHeight:1.7 }}>{activeNPC.dialogue[idx]}</div>
          <div style={{ color:'#888', fontSize:12, textAlign:'right', marginTop:8 }}>{idx < activeNPC.dialogue.length - 1 ? '▼ タップで次へ' : '▼ タップで閉じる'}</div>
        </div>
      )}

      {/* ボスクリア演出 */}
      {showClearMsg && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, zIndex:50 }}>
          <div style={{ fontSize:'1.5rem', color:'#f0d080', textAlign:'center' }}>🗺️</div>
          <div style={{ fontSize:'1.1rem', color:'#f0d080', textAlign:'center', lineHeight:1.8 }}>
            丘の番人をたおした！<br />地図のかけら（旭区）を手に入れた！
          </div>
          <button
            onClick={() => setShowClearMsg(false)}
            style={{ padding:'12px 32px', background:'#2a2a4a', color:'#e8e8e8', border:'1px solid #f0d080', borderRadius:8, fontSize:'1rem', cursor:'pointer', fontFamily:'inherit' }}
          >
            OK
          </button>
        </div>
      )}

      {/* メニュー */}
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
