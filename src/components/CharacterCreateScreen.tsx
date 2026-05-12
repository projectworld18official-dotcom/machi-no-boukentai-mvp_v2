import { useState } from 'react';
import type { Gender } from '../types/game';
interface Props { startNewGame: (name: string, gender: Gender) => void; }
export const CharacterCreateScreen = ({ startNewGame }: Props) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const canStart = name.trim().length > 0 && gender !== null;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'#1a1a2e', gap:32, padding:'0 24px' }}>
      <h2 style={{ color:'#f0d080', fontSize:22 }}>なまえとせいべつをえらんでね</h2>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="なまえをいれてね" maxLength={10}
        style={{ padding:'12px 16px', fontSize:18, width:'100%', maxWidth:320, background:'transparent', border:'1px solid #888', color:'#e8e8e8', borderRadius:4, outline:'none', textAlign:'center', fontFamily:'inherit' }} />
      <div style={{ display:'flex', gap:16 }}>
        {(['male','female'] as const).map(g => (
          <button key={g} onClick={() => setGender(g)} style={{ padding:'12px 32px', fontSize:16, background:gender===g?'#f0d080':'transparent', border:'2px solid #f0d080', color:gender===g?'#1a1a2e':'#f0d080', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>
            {g === 'male' ? '男の子' : '女の子'}
          </button>
        ))}
      </div>
      <button onClick={() => canStart && startNewGame(name.trim(), gender!)} disabled={!canStart}
        style={{ padding:'14px 48px', fontSize:18, background:canStart?'#f0d080':'transparent', border:`2px solid ${canStart?'#f0d080':'#555'}`, color:canStart?'#1a1a2e':'#555', borderRadius:4, cursor:canStart?'pointer':'not-allowed', fontFamily:'inherit' }}>
        ぼうけんにでる
      </button>
    </div>
  );
};
