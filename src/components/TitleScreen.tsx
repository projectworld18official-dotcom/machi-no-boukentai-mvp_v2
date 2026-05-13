import type { GameState } from '../types/game';
import { unlockAudio } from '../utils/audio';

interface Props {
  goToScreen: (screen: GameState['screen']) => void;
  loadGame: () => boolean;
}

export const TitleScreen = ({ goToScreen, loadGame }: Props) => {
  const hasSave = localStorage.getItem('hamano_save') !== null;

  const handleStart = async () => {
    await unlockAudio();
    goToScreen('character-create');
  };

  const handleContinue = async () => {
    await unlockAudio();
    loadGame();
    goToScreen('field');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'#1a1a2e', gap:24 }}>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:'2.2rem', fontWeight:'bold', letterSpacing:'0.1em', color:'#f5c842', textShadow:'0 0 20px rgba(245,200,66,0.5)', margin:0 }}>
          ハマの冒険隊
        </h1>
        <p style={{ color:'#888', fontSize:'0.9rem', marginTop:'8px' }}>横浜に隠された18の島の冒険</p>
      </div>
      <button onClick={handleStart} style={{ padding:'14px 40px', fontSize:18, background:'transparent', border:'2px solid #f0d080', color:'#f0d080', borderRadius:4, cursor:'pointer', letterSpacing:'0.1em', fontFamily:'inherit' }}>はじめから</button>
      {hasSave && (
        <button onClick={handleContinue} style={{ padding:'14px 40px', fontSize:18, background:'transparent', border:'2px solid #80c0ff', color:'#80c0ff', borderRadius:4, cursor:'pointer', letterSpacing:'0.1em', fontFamily:'inherit' }}>つづきから</button>
      )}
    </div>
  );
};
