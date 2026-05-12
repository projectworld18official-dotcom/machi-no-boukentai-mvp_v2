import { useState } from 'react';
import type { GameState } from '../types/game';
interface Props { state: GameState; goToScreen: (screen: GameState['screen']) => void; }
const COMMANDS = ['たたかう','まほう','どうぐ','にげる'] as const;
export const BattleScreen = ({ state: _state, goToScreen }: Props) => {
  const [message, setMessage] = useState('どうする？');
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh', background:'#1a1a2e', padding:16 }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#e8e8e8', fontSize:20 }}>？？？ が あらわれた！</div>
      <div style={{ background:'#0f0f1e', border:'2px solid #f0d080', borderRadius:4, padding:'16px 20px', marginBottom:12, fontSize:17, color:'#e8e8e8', minHeight:60 }}>{message}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {COMMANDS.map(cmd => (
          <button key={cmd} onClick={() => setMessage(`${cmd} を えらんだ！`)} style={{ padding:14, background:'#16213e', border:'1px solid #f0d080', color:'#f0d080', borderRadius:4, cursor:'pointer', fontSize:16, fontFamily:'inherit' }}>{cmd}</button>
        ))}
      </div>
      <button onClick={() => goToScreen('field')} style={{ padding:12, background:'transparent', border:'1px solid #888', color:'#888', borderRadius:4, cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>フィールドへもどる（テスト）</button>
    </div>
  );
};
