import { useEffect, useState } from 'react';
import type { GameState } from '../types/game';
import { asaIslandVillageNPCs } from '../data/npcs';
import type { NPC } from '../data/npcs';
import { playBGM, stopBGM } from '../utils/audio';

interface Props { state: GameState; goToScreen: (screen: GameState['screen']) => void; }

export const FieldScreen = ({ state, goToScreen }: Props) => {
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [idx, setIdx] = useState(0);

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
      <div style={{ textAlign:'center', padding:12, color:'#f0d080', fontSize:18, borderBottom:'1px solid #333', marginBottom:24 }}>あさ島 — 村</div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        {asaIslandVillageNPCs.map(npc => (
          <button key={npc.id} onClick={() => open(npc)} style={{ padding:'14px 16px', background:'#16213e', border:'1px solid #333', color:'#e8e8e8', borderRadius:4, cursor:'pointer', textAlign:'left', fontSize:16, fontFamily:'inherit' }}>{npc.name}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:12, justifyContent:'center', padding:'12px 0', borderTop:'1px solid #333', marginTop:16, flexWrap:'wrap' }}>
        {party.map((m, i) => <span key={i} style={{ color:'#aad4aa', fontSize:14 }}>{m.name}</span>)}
      </div>
      <button onClick={() => goToScreen('battle')} style={{ marginTop:12, padding:12, background:'transparent', border:'1px solid #c06060', color:'#c06060', borderRadius:4, cursor:'pointer', fontSize:15, fontFamily:'inherit' }}>バトルへ（テスト）</button>
      {activeNPC && (
        <div onClick={advance} style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'#0f0f1e', border:'2px solid #f0d080', borderRadius:'8px 8px 0 0', padding:'20px 24px 24px', cursor:'pointer' }}>
          <div style={{ color:'#f0d080', fontSize:13, marginBottom:8 }}>{activeNPC.name}</div>
          <div style={{ color:'#e8e8e8', fontSize:17, lineHeight:1.7 }}>{activeNPC.dialogue[idx]}</div>
          <div style={{ color:'#888', fontSize:12, textAlign:'right', marginTop:8 }}>{idx < activeNPC.dialogue.length - 1 ? '▼ タップで次へ' : '▼ タップで閉じる'}</div>
        </div>
      )}
    </div>
  );
};
